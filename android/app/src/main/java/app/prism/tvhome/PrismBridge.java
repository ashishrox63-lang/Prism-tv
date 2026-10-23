package app.prism.tvhome;

import android.app.Activity;
import android.app.ActivityManager;
import android.app.SearchManager;
import android.content.ActivityNotFoundException;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.content.pm.ResolveInfo;
import android.media.tv.TvContract;
import android.media.tv.TvInputInfo;
import android.media.tv.TvInputManager;
import android.net.Uri;
import android.os.Build;
import android.provider.Settings;
import android.speech.RecognizerIntent;
import android.util.DisplayMetrics;
import android.view.inputmethod.InputMethodInfo;
import android.view.inputmethod.InputMethodManager;
import android.webkit.JavascriptInterface;
import android.webkit.WebView;
import android.widget.Toast;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

/** Everything the web home screen can ask the TV to do. Exposed to JavaScript as window.PrismNative. */
class PrismBridge {

    static final int VOICE_REQUEST = 42;
    private static final String[] INPUT_APPS = { "com.mediatek.wwtv.tvcenter", "com.android.tv", "com.google.android.tv", "com.oneplus.tv.tvcenter", "com.droidlogic.tvinput" };
    private static final ExecutorService NET = Executors.newFixedThreadPool(3);

    private final Context ctx;
    private final WebView web;
    private final Activity activity;

    PrismBridge(Context ctx, WebView web, Activity activity) {
        this.ctx = ctx;
        this.web = web;
        this.activity = activity;
    }

    private void js(final String code) {
        PrismApp.app.ui.post(new Runnable() {
            @Override
            public void run() { try { web.evaluateJavascript(code, null); } catch (Exception ignored) { } }
        });
    }

    private void toast(final String t) {
        PrismApp.app.ui.post(new Runnable() {
            @Override
            public void run() { Toast.makeText(ctx, t, Toast.LENGTH_LONG).show(); }
        });
    }

    private boolean start(Intent i) {
        try {
            i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_RESET_TASK_IF_NEEDED);
            ctx.startActivity(i);
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    /* ---------- Apps and inputs ---------- */

    @JavascriptInterface
    public String apps() { return PrismApp.app.catalog.appsJson(); }

    @JavascriptInterface
    public boolean launch(String pkg) {
        Intent i = PrismApp.app.catalog.launchIntent(pkg);
        return i != null && start(i);
    }

    @JavascriptInterface
    public String inputs() {
        JSONArray a = new JSONArray();
        try {
            TvInputManager tim = (TvInputManager) ctx.getSystemService(Context.TV_INPUT_SERVICE);
            if (tim != null) {
                for (TvInputInfo info : tim.getTvInputList()) {
                    if (!info.isPassthroughInput() || info.isHidden(ctx)) continue;
                    JSONObject o = new JSONObject();
                    CharSequence custom = info.loadCustomLabel(ctx);
                    o.put("id", info.getId());
                    o.put("label", String.valueOf(custom != null && custom.length() > 0 ? custom : info.loadLabel(ctx)));
                    a.put(o);
                }
            }
        } catch (Exception ignored) { }
        return a.toString();
    }

    @JavascriptInterface
    public boolean openInput(String id) {
        if (start(new Intent(Intent.ACTION_VIEW, TvContract.buildChannelUriForPassthroughInput(id)))) return true;
        return openInputsApp();
    }

    private boolean openInputsApp() {
        for (String p : INPUT_APPS) {
            Intent i = PrismApp.app.catalog.launchIntent(p);
            if (i != null && start(i)) return true;
        }
        return false;
    }

    @JavascriptInterface
    public boolean open(String what) {
        if (what.startsWith("appinfo:")) return start(new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS, Uri.parse("package:" + what.substring(8))));
        if ("inputs".equals(what)) {
            if (openInputsApp()) return true;
            toast("Use the Input or Source button on your remote");
            return false;
        }
        String action;
        Intent i;
        switch (what) {
            case "wifi": action = Settings.ACTION_WIFI_SETTINGS; break;
            case "bluetooth": action = Settings.ACTION_BLUETOOTH_SETTINGS; break;
            case "set-dream": action = Settings.ACTION_DREAM_SETTINGS; break;
            case "set-access": action = Settings.ACTION_ACCESSIBILITY_SETTINGS; break;
            case "set-ime": action = Settings.ACTION_INPUT_METHOD_SETTINGS; break;
            case "set-install":
                i = new Intent(Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES, Uri.parse("package:" + ctx.getPackageName()));
                if (start(i)) return true;
                action = Settings.ACTION_SECURITY_SETTINGS; break;
            default: action = Settings.ACTION_SETTINGS;
        }
        if (start(new Intent(action))) return true;
        return start(new Intent(Settings.ACTION_SETTINGS));
    }

    @JavascriptInterface
    public boolean search(String pkg, String q) {
        Intent s = new Intent(Intent.ACTION_SEARCH).setPackage(pkg).putExtra(SearchManager.QUERY, q).putExtra("query", q);
        if ("com.android.vending".equals(pkg)) return start(new Intent(Intent.ACTION_VIEW, Uri.parse("market://search?c=apps&q=" + Uri.encode(q))));
        if ("com.netflix.ninja".equals(pkg) && start(new Intent(Intent.ACTION_VIEW, Uri.parse("https://www.netflix.com/search?q=" + Uri.encode(q))).setPackage(pkg))) return true;
        if (start(s)) return true;
        if (pkg.contains("youtube") && start(new Intent(Intent.ACTION_VIEW, Uri.parse("https://www.youtube.com/results?search_query=" + Uri.encode(q))).setPackage(pkg))) return true;
        return launch(pkg);
    }

    /* ---------- Voice ---------- */

    @JavascriptInterface
    public boolean voice() {
        if (activity == null) return false;
        final Intent i = new Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH);
        i.putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM);
        i.putExtra(RecognizerIntent.EXTRA_PROMPT, "Say an app, an input or what to search");
        i.putExtra(RecognizerIntent.EXTRA_LANGUAGE, "en-IN");
        if (i.resolveActivity(ctx.getPackageManager()) == null) return false;
        PrismApp.app.ui.post(new Runnable() {
            @Override
            public void run() {
                try { activity.startActivityForResult(i, VOICE_REQUEST); } catch (ActivityNotFoundException ignored) { }
            }
        });
        return true;
    }

    /* ---------- Network requests for live information ---------- */

    @JavascriptInterface
    public void fetch(final String id, final String url) {
        NET.execute(new Runnable() {
            @Override
            public void run() {
                String text = null;
                try { text = get(url, 3 * 1024 * 1024); } catch (Exception ignored) { }
                js("window.PrismFetchDone && PrismFetchDone(" + JSONObject.quote(id) + "," + (text != null) + "," + JSONObject.quote(text == null ? "" : text) + ")");
            }
        });
    }

    static String get(String url, int max) throws Exception {
        if (!url.startsWith("https://") && !url.startsWith("http://")) return null;
        HttpURLConnection c = (HttpURLConnection) new URL(url).openConnection();
        c.setConnectTimeout(12000);
        c.setReadTimeout(15000);
        c.setInstanceFollowRedirects(true);
        c.setRequestProperty("User-Agent", "Prism/1.0 (Android TV)");
        try {
            int code = c.getResponseCode();
            if (code < 200 || code >= 300) return null;
            InputStream in = c.getInputStream();
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            byte[] buf = new byte[16384];
            int n, total = 0;
            while ((n = in.read(buf)) > 0) { out.write(buf, 0, n); total += n; if (total > max) break; }
            String ct = c.getContentType(), cs = "UTF-8";
            if (ct != null && ct.toLowerCase().contains("charset=")) cs = ct.substring(ct.toLowerCase().indexOf("charset=") + 8).replace("\"", "").trim();
            return out.toString(cs);
        } finally {
            c.disconnect();
        }
    }

    /* ---------- Photos, media, night ---------- */

    @JavascriptInterface
    public String photos() { return Photos.json(ctx, WebHost.BASE + "user-photos/", ""); }

    @JavascriptInterface
    public String nowPlaying() { return NowPlaying.currentJson(ctx); }

    @JavascriptInterface
    public void media(String cmd) { NowPlaying.control(ctx, cmd); }

    @JavascriptInterface
    public void setNight(String hhmm) {
        PrismApp.app.prefs().edit().putString("night", hhmm == null ? "off" : hhmm).apply();
        NightReceiver.schedule(ctx);
    }

    @JavascriptInterface
    public void snoozeNight(int minutes) { NightReceiver.snooze(ctx, minutes); }

    @JavascriptInterface
    public boolean sleepNow() { return PrismAccess.sleep(); }

    /* ---------- Phone remote, device facts, setup status ---------- */

    @JavascriptInterface
    public String companion() {
        try {
            String ip = PrismApp.ip();
            JSONObject o = new JSONObject();
            o.put("url", ip == null ? "" : "http://" + ip + ":" + PrismApp.PORT + "/?t=" + PrismApp.app.token());
            return o.toString();
        } catch (Exception e) {
            return "{}";
        }
    }

    @JavascriptInterface
    public String deviceInfo() {
        try {
            ActivityManager am = (ActivityManager) ctx.getSystemService(Context.ACTIVITY_SERVICE);
            ActivityManager.MemoryInfo mi = new ActivityManager.MemoryInfo();
            am.getMemoryInfo(mi);
            DisplayMetrics dm = ctx.getResources().getDisplayMetrics();
            JSONObject o = new JSONObject();
            o.put("model", Build.MANUFACTURER + " " + Build.MODEL);
            o.put("android", Build.VERSION.RELEASE + ", " + dm.widthPixels + " by " + dm.heightPixels + " screen");
            o.put("memory", String.format("%.1f GB%s", mi.totalMem / 1073741824.0, am.isLowRamDevice() ? ", low memory" : ""));
            o.put("version", version());
            o.put("lowRam", am.isLowRamDevice() || mi.totalMem < 1700L * 1048576L);
            return o.toString();
        } catch (Exception e) {
            return "{}";
        }
    }

    @JavascriptInterface
    public String status() {
        try {
            String pkg = ctx.getPackageName();
            JSONObject o = new JSONObject();
            String dreams = Settings.Secure.getString(ctx.getContentResolver(), "screensaver_components");
            o.put("dream", dreams != null && dreams.contains(pkg));
            String acc = Settings.Secure.getString(ctx.getContentResolver(), Settings.Secure.ENABLED_ACCESSIBILITY_SERVICES);
            o.put("access", acc != null && acc.contains(pkg));
            boolean ime = false;
            InputMethodManager imm = (InputMethodManager) ctx.getSystemService(Context.INPUT_METHOD_SERVICE);
            if (imm != null) for (InputMethodInfo info : imm.getEnabledInputMethodList()) if (pkg.equals(info.getPackageName())) ime = true;
            o.put("ime", ime);
            String ls = Settings.Secure.getString(ctx.getContentResolver(), "enabled_notification_listeners");
            o.put("listener", ls != null && ls.contains(pkg));
            o.put("install", Build.VERSION.SDK_INT < 26 || ctx.getPackageManager().canRequestPackageInstalls());
            return o.toString();
        } catch (Exception e) {
            return "{}";
        }
    }

    @JavascriptInterface
    public String version() {
        try { return ctx.getPackageManager().getPackageInfo(ctx.getPackageName(), 0).versionName; } catch (Exception e) { return ""; }
    }

    /* ---------- Updates and safety ---------- */

    @JavascriptInterface
    public void checkUpdate(String url) {
        Updater.check(ctx, url, new Updater.Result() {
            @Override
            public void done(String json) { js("window.Prism && Prism.onUpdate(" + JSONObject.quote(json) + ")"); }
        });
    }

    @JavascriptInterface
    public void installUpdate(String apkUrl) {
        Updater.downloadAndInstall(ctx, apkUrl, new Updater.Result() {
            @Override
            public void done(String json) { js("window.Prism && Prism.onUpdate(" + JSONObject.quote(json) + ")"); }
        });
    }

    @JavascriptInterface
    public boolean openStockHome() { return openStockHome(ctx); }

    static boolean openStockHome(Context ctx) {
        Intent home = new Intent(Intent.ACTION_MAIN).addCategory(Intent.CATEGORY_HOME);
        for (ResolveInfo r : ctx.getPackageManager().queryIntentActivities(home, PackageManager.MATCH_DEFAULT_ONLY)) {
            if (ctx.getPackageName().equals(r.activityInfo.packageName)) continue;
            Intent i = new Intent(Intent.ACTION_MAIN).addCategory(Intent.CATEGORY_HOME)
                    .setComponent(new ComponentName(r.activityInfo.packageName, r.activityInfo.name))
                    .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            try { ctx.startActivity(i); return true; } catch (Exception ignored) { }
        }
        return false;
    }

    @JavascriptInterface
    public void ready() { if (activity instanceof MainActivity) ((MainActivity) activity).markReady(); }
}
