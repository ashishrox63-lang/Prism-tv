package app.prism.tvhome;

import android.app.Application;
import android.content.Context;
import android.content.SharedPreferences;
import android.os.Handler;
import android.os.Looper;
import android.webkit.WebView;

import org.json.JSONTokener;

import java.net.Inet4Address;
import java.net.InetAddress;
import java.net.NetworkInterface;
import java.security.SecureRandom;
import java.util.Collections;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;

/** App-wide state: crash tracking, the phone-remote server, pairing token and a bridge to the home screen's JavaScript. */
public class PrismApp extends Application {

    static PrismApp app;
    static volatile MainActivity main;
    static volatile boolean foreground;
    static final int PORT = 8765;

    AppCatalog catalog;
    CompanionServer server;
    final Handler ui = new Handler(Looper.getMainLooper());

    @Override
    public void onCreate() {
        super.onCreate();
        app = this;
        catalog = new AppCatalog(this);
        installCrashHandler();
        server = new CompanionServer(this);
        server.start();
        NightReceiver.schedule(this);
    }

    SharedPreferences prefs() { return getSharedPreferences("prism", Context.MODE_PRIVATE); }

    /* ---------- Safety net: notice repeated crashes ---------- */

    private void installCrashHandler() {
        final Thread.UncaughtExceptionHandler previous = Thread.getDefaultUncaughtExceptionHandler();
        Thread.setDefaultUncaughtExceptionHandler(new Thread.UncaughtExceptionHandler() {
            @Override
            public void uncaughtException(Thread t, Throwable e) {
                try {
                    String list = prefs().getString("crashes", "");
                    prefs().edit().putString("crashes", list + System.currentTimeMillis() + ",").commit();
                } catch (Throwable ignored) { }
                if (previous != null) previous.uncaughtException(t, e);
            }
        });
    }

    boolean crashLoop() {
        long now = System.currentTimeMillis();
        int recent = 0;
        for (String s : prefs().getString("crashes", "").split(",")) {
            try { if (s.length() > 0 && now - Long.parseLong(s) < 180000) recent++; } catch (NumberFormatException ignored) { }
        }
        return recent >= 3;
    }

    void clearCrashes() { prefs().edit().remove("crashes").apply(); }

    /* ---------- Phone pairing ---------- */

    String token() {
        String t = prefs().getString("token", null);
        if (t == null) {
            String abc = "abcdefghjkmnpqrstuvwxyz23456789";
            SecureRandom r = new SecureRandom();
            StringBuilder b = new StringBuilder();
            for (int i = 0; i < 10; i++) b.append(abc.charAt(r.nextInt(abc.length())));
            t = b.toString();
            prefs().edit().putString("token", t).apply();
        }
        return t;
    }

    static String ip() {
        try {
            String fallback = null;
            for (NetworkInterface n : Collections.list(NetworkInterface.getNetworkInterfaces())) {
                if (!n.isUp() || n.isLoopback()) continue;
                for (InetAddress a : Collections.list(n.getInetAddresses())) {
                    if (a instanceof Inet4Address && !a.isLoopbackAddress()) {
                        String name = n.getName();
                        if (name.startsWith("wlan") || name.startsWith("eth")) return a.getHostAddress();
                        if (fallback == null) fallback = a.getHostAddress();
                    }
                }
            }
            return fallback;
        } catch (Exception e) {
            return null;
        }
    }

    /* ---------- Running JavaScript in the home screen from other threads ---------- */

    /** Runs code in the home screen and returns the string result, or null if Prism is not open. Call off the UI thread. */
    String evalBlocking(final String code, long timeoutMs) {
        final MainActivity m = main;
        if (m == null || !m.isReady()) return null;
        final String[] out = { null };
        final CountDownLatch latch = new CountDownLatch(1);
        ui.post(new Runnable() {
            @Override
            public void run() {
                WebView w = m.web();
                if (w == null) { latch.countDown(); return; }
                w.evaluateJavascript(code, new android.webkit.ValueCallback<String>() {
                    @Override
                    public void onReceiveValue(String value) { out[0] = value; latch.countDown(); }
                });
            }
        });
        try { latch.await(timeoutMs, TimeUnit.MILLISECONDS); } catch (InterruptedException ignored) { }
        if (out[0] == null || "null".equals(out[0])) return null;
        try {
            Object v = new JSONTokener(out[0]).nextValue();
            return v instanceof String ? (String) v : String.valueOf(v);
        } catch (Exception e) {
            return out[0];
        }
    }
}
