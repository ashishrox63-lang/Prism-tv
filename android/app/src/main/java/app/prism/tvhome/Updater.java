package app.prism.tvhome;

import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageInfo;
import android.content.pm.PackageInstaller;
import android.net.Uri;
import android.os.Build;
import android.provider.Settings;

import org.json.JSONObject;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;

/**
 * Self-update. Reads a small version.json (versionCode, versionName, apk) from the link you set on the
 * phone remote, and installs a newer Prism with one confirmation on the TV. Your settings are kept.
 */
final class Updater {

    interface Result { void done(String json); }

    private Updater() { }

    @SuppressWarnings("deprecation")
    static long installedVersion(Context ctx) {
        try {
            PackageInfo pi = ctx.getPackageManager().getPackageInfo(ctx.getPackageName(), 0);
            return Build.VERSION.SDK_INT >= 28 ? pi.getLongVersionCode() : pi.versionCode;
        } catch (Exception e) {
            return 0;
        }
    }

    static void check(final Context ctx, final String url, final Result cb) {
        new Thread(new Runnable() {
            @Override
            public void run() {
                JSONObject o = new JSONObject();
                try {
                    String text = PrismBridge.get(url, 100000);
                    if (text == null) throw new Exception("The update link did not answer");
                    JSONObject j = new JSONObject(text);
                    long code = j.getLong("versionCode");
                    o.put("newer", code > installedVersion(ctx));
                    o.put("versionName", j.optString("versionName", String.valueOf(code)));
                    o.put("apk", j.getString("apk"));
                } catch (Exception e) {
                    try { o.put("error", e.getMessage() == null ? "Could not check for updates" : e.getMessage()); } catch (Exception ignored) { }
                }
                cb.done(o.toString());
            }
        }).start();
    }

    static void downloadAndInstall(final Context ctx, final String apkUrl, final Result cb) {
        new Thread(new Runnable() {
            @Override
            public void run() {
                String err;
                try {
                    File f = new File(ctx.getCacheDir(), "update.apk");
                    download(apkUrl, f);
                    err = installFile(ctx, f);
                } catch (Exception e) {
                    err = "The download did not finish";
                }
                if (err != null) {
                    try { JSONObject o = new JSONObject(); o.put("error", err); cb.done(o.toString()); } catch (Exception ignored) { }
                }
            }
        }).start();
    }

    private static void download(String url, File to) throws Exception {
        for (int hop = 0; hop < 5; hop++) {
            HttpURLConnection c = (HttpURLConnection) new URL(url).openConnection();
            c.setInstanceFollowRedirects(false);
            c.setConnectTimeout(15000);
            c.setReadTimeout(60000);
            c.setRequestProperty("User-Agent", "Prism/1.0 (Android TV)");
            int code = c.getResponseCode();
            if (code >= 300 && code < 400 && c.getHeaderField("Location") != null) { url = new URL(new URL(url), c.getHeaderField("Location")).toString(); c.disconnect(); continue; }
            if (code != 200) throw new Exception("HTTP " + code);
            InputStream in = c.getInputStream();
            OutputStream out = new FileOutputStream(to);
            try {
                byte[] buf = new byte[65536];
                int n;
                while ((n = in.read(buf)) > 0) out.write(buf, 0, n);
            } finally {
                out.close();
                c.disconnect();
            }
            return;
        }
        throw new Exception("Too many redirects");
    }

    /** Returns null when the system install prompt was started, or a plain-English problem. */
    static String installFile(Context ctx, File apk) {
        if (Build.VERSION.SDK_INT >= 26 && !ctx.getPackageManager().canRequestPackageInstalls()) {
            try {
                ctx.startActivity(new Intent(Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES, Uri.parse("package:" + ctx.getPackageName())).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK));
            } catch (Exception ignored) { }
            return "Allow Prism to install updates on the TV, then try again";
        }
        try {
            PackageInstaller pi = ctx.getPackageManager().getPackageInstaller();
            PackageInstaller.SessionParams params = new PackageInstaller.SessionParams(PackageInstaller.SessionParams.MODE_FULL_INSTALL);
            params.setAppPackageName(ctx.getPackageName());
            int id = pi.createSession(params);
            PackageInstaller.Session s = pi.openSession(id);
            InputStream in = new FileInputStream(apk);
            OutputStream out = s.openWrite("prism.apk", 0, apk.length());
            try {
                byte[] buf = new byte[65536];
                int n;
                while ((n = in.read(buf)) > 0) out.write(buf, 0, n);
                s.fsync(out);
            } finally {
                in.close();
                out.close();
            }
            int flags = PendingIntent.FLAG_UPDATE_CURRENT | (Build.VERSION.SDK_INT >= 31 ? 0x02000000 /* FLAG_MUTABLE */ : 0);
            PendingIntent done = PendingIntent.getBroadcast(ctx, 11, new Intent(ctx, InstallDone.class), flags);
            s.commit(done.getIntentSender());
            s.close();
            return null;
        } catch (Exception e) {
            return "The update could not be installed";
        }
    }

    /** Shows the system's install confirmation when Android asks for it. */
    public static class InstallDone extends BroadcastReceiver {
        @Override
        @SuppressWarnings("deprecation")
        public void onReceive(Context ctx, Intent intent) {
            int status = intent.getIntExtra(PackageInstaller.EXTRA_STATUS, -1);
            if (status == PackageInstaller.STATUS_PENDING_USER_ACTION) {
                Intent confirm = intent.getParcelableExtra(Intent.EXTRA_INTENT);
                if (confirm != null) {
                    confirm.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                    try { ctx.startActivity(confirm); } catch (Exception ignored) { }
                }
            }
        }
    }
}
