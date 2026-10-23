package app.prism.tvhome;

import android.content.Context;
import android.content.Intent;
import android.content.pm.ApplicationInfo;
import android.content.pm.PackageInfo;
import android.content.pm.PackageManager;
import android.content.pm.ResolveInfo;
import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.drawable.BitmapDrawable;
import android.graphics.drawable.Drawable;
import android.os.Build;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.ByteArrayOutputStream;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/** Installed apps: names, categories, icons, TV banners and a representative colour for each. */
class AppCatalog {

    private final Context ctx;
    private final Map<String, byte[]> icons = new HashMap<String, byte[]>();
    private final Map<String, byte[]> banners = new HashMap<String, byte[]>();
    private final Map<String, String> colours = new HashMap<String, String>();

    AppCatalog(Context c) { ctx = c.getApplicationContext(); }

    synchronized void forget(String pkg) { icons.remove(pkg); banners.remove(pkg); colours.remove(pkg); }

    private List<ResolveInfo> query(String category) {
        Intent i = new Intent(Intent.ACTION_MAIN);
        i.addCategory(category);
        return ctx.getPackageManager().queryIntentActivities(i, 0);
    }

    Map<String, ResolveInfo> launchable() {
        Map<String, ResolveInfo> out = new LinkedHashMap<String, ResolveInfo>();
        for (ResolveInfo r : query(Intent.CATEGORY_LEANBACK_LAUNCHER)) out.put(r.activityInfo.packageName, r);
        for (ResolveInfo r : query(Intent.CATEGORY_LAUNCHER)) {
            String p = r.activityInfo.packageName;
            if (!out.containsKey(p)) out.put(p, r);
        }
        out.remove(ctx.getPackageName());
        return out;
    }

    String appsJson() {
        JSONArray list = new JSONArray();
        PackageManager pm = ctx.getPackageManager();
        for (Map.Entry<String, ResolveInfo> e : launchable().entrySet()) {
            String pkg = e.getKey();
            ResolveInfo r = e.getValue();
            try {
                JSONObject o = new JSONObject();
                o.put("id", pkg);
                o.put("name", String.valueOf(r.loadLabel(pm)));
                o.put("color", colour(pkg));
                o.put("cat", category(r.activityInfo.applicationInfo));
                long ver = 0;
                try {
                    PackageInfo pi = pm.getPackageInfo(pkg, 0);
                    ver = Build.VERSION.SDK_INT >= 28 ? pi.getLongVersionCode() : versionCodeOld(pi);
                } catch (Exception ignored) { }
                o.put("icon", WebHost.BASE + "app-icon/" + pkg + "?v=" + ver);
                if (bannerDrawable(pkg) != null) o.put("banner", WebHost.BASE + "app-banner/" + pkg + "?v=" + ver);
                list.put(o);
            } catch (Exception ignored) { }
        }
        return list.toString();
    }

    @SuppressWarnings("deprecation")
    private static long versionCodeOld(PackageInfo pi) { return pi.versionCode; }

    synchronized byte[] icon(String pkg) {
        if (icons.containsKey(pkg)) return icons.get(pkg);
        byte[] png = null;
        try {
            Drawable d = ctx.getPackageManager().getApplicationIcon(pkg);
            Bitmap b = render(d, 192, 192);
            png = toPng(b);
            colours.put(pkg, dominant(b));
        } catch (Exception ignored) { }
        icons.put(pkg, png);
        return png;
    }

    synchronized byte[] banner(String pkg) {
        if (banners.containsKey(pkg)) return banners.get(pkg);
        byte[] png = null;
        Drawable d = bannerDrawable(pkg);
        if (d != null) {
            try { png = toPng(render(d, 640, 360)); } catch (Exception ignored) { }
        }
        banners.put(pkg, png);
        return png;
    }

    Drawable bannerDrawable(String pkg) {
        PackageManager pm = ctx.getPackageManager();
        try {
            Intent i = pm.getLeanbackLaunchIntentForPackage(pkg);
            if (i != null && i.getComponent() != null) {
                Drawable d = pm.getActivityBanner(i.getComponent());
                if (d != null) return d;
            }
            return pm.getApplicationBanner(pkg);
        } catch (Exception e) {
            return null;
        }
    }

    synchronized String colour(String pkg) {
        if (!colours.containsKey(pkg)) icon(pkg);
        String c = colours.get(pkg);
        return c != null ? c : "#3d57d6";
    }

    Intent launchIntent(String pkg) {
        PackageManager pm = ctx.getPackageManager();
        Intent i = pm.getLeanbackLaunchIntentForPackage(pkg);
        if (i == null) i = pm.getLaunchIntentForPackage(pkg);
        return i;
    }

    static Bitmap render(Drawable d, int w, int h) {
        if (d instanceof BitmapDrawable && ((BitmapDrawable) d).getBitmap() != null) {
            return Bitmap.createScaledBitmap(((BitmapDrawable) d).getBitmap(), w, h, true);
        }
        Bitmap b = Bitmap.createBitmap(w, h, Bitmap.Config.ARGB_8888);
        Canvas c = new Canvas(b);
        d.setBounds(0, 0, w, h);
        d.draw(c);
        return b;
    }

    static byte[] toPng(Bitmap b) {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        b.compress(Bitmap.CompressFormat.PNG, 100, out);
        return out.toByteArray();
    }

    /** The icon's most saturated common colour, kept in a range that reads well on screen. */
    static String dominant(Bitmap src) {
        Bitmap b = Bitmap.createScaledBitmap(src, 24, 24, true);
        float[] hsv = new float[3];
        double wr = 0, wg = 0, wb = 0, wt = 0, ar = 0, ag = 0, ab = 0, at = 0;
        for (int y = 0; y < 24; y++) {
            for (int x = 0; x < 24; x++) {
                int p = b.getPixel(x, y);
                if (Color.alpha(p) < 128) continue;
                int r = Color.red(p), g = Color.green(p), bl = Color.blue(p);
                Color.RGBToHSV(r, g, bl, hsv);
                ar += r; ag += g; ab += bl; at += 1;
                if (hsv[1] < 0.25f || hsv[2] < 0.18f) continue;
                double weight = hsv[1] * hsv[1] * hsv[2];
                wr += r * weight; wg += g * weight; wb += bl * weight; wt += weight;
            }
        }
        int r, g, bl;
        if (wt > 0.5) { r = (int) (wr / wt); g = (int) (wg / wt); bl = (int) (wb / wt); }
        else if (at > 0) { r = (int) (ar / at); g = (int) (ag / at); bl = (int) (ab / at); }
        else return "#3d57d6";
        Color.RGBToHSV(r, g, bl, hsv);
        hsv[2] = Math.max(0.42f, Math.min(hsv[2], 0.86f));
        if (hsv[1] < 0.12f) { hsv[0] = 232f; hsv[1] = 0.35f; hsv[2] = 0.45f; }
        return String.format("#%06x", Color.HSVToColor(hsv) & 0xFFFFFF);
    }

    static String category(ApplicationInfo ai) {
        if (Build.VERSION.SDK_INT < 26 || ai == null) return "App";
        switch (ai.category) {
            case ApplicationInfo.CATEGORY_GAME: return "Games";
            case ApplicationInfo.CATEGORY_AUDIO: return "Music and audio";
            case ApplicationInfo.CATEGORY_VIDEO: return "Video";
            case ApplicationInfo.CATEGORY_IMAGE: return "Photos";
            case ApplicationInfo.CATEGORY_SOCIAL: return "Social";
            case ApplicationInfo.CATEGORY_NEWS: return "News";
            case ApplicationInfo.CATEGORY_MAPS: return "Maps";
            case ApplicationInfo.CATEGORY_PRODUCTIVITY: return "Productivity";
            default: return (ai.flags & ApplicationInfo.FLAG_SYSTEM) != 0 ? "TV app" : "App";
        }
    }
}
