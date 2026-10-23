package app.prism.tvhome;

import android.app.Activity;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.speech.RecognizerIntent;
import android.view.KeyEvent;
import android.view.View;
import android.view.WindowManager;
import android.webkit.ValueCallback;
import android.webkit.WebView;
import android.widget.FrameLayout;
import android.widget.Toast;

import org.json.JSONObject;

import java.util.ArrayList;

/**
 * Prism's home screen. Hosts the web interface in a WebView and forwards the remote keys the WebView
 * never sees (Back, Menu, Home). Includes a safety net: if Prism keeps crashing or the page never
 * starts, the TV's own home screen opens instead.
 */
public class MainActivity extends Activity implements WebHost.Events {

    private WebView web;
    private FrameLayout root;
    private boolean pageReady = false, jsReady = false, pendingSleep = false;
    private int reloads = 0;
    private BroadcastReceiver packageReceiver;

    @Override
    protected void onCreate(Bundle state) {
        super.onCreate(state);
        if (PrismApp.app.crashLoop()) {
            PrismApp.app.clearCrashes();
            Toast.makeText(this, "Prism had a problem, so the TV's own home screen is open", Toast.LENGTH_LONG).show();
            PrismBridge.openStockHome(this);
            finish();
            return;
        }
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_FULLSCREEN);
        getWindow().getDecorView().setBackgroundColor(WebHost.VOID);
        hideSystemBars();
        root = new FrameLayout(this);
        setContentView(root);
        buildWebView();
        registerPackageReceiver();
        PrismApp.main = this;
        handleIntent(getIntent());
    }

    private void buildWebView() {
        if (web != null) { root.removeView(web); web.destroy(); }
        pageReady = false;
        jsReady = false;
        web = new WebView(this);
        if ((getApplicationInfo().flags & android.content.pm.ApplicationInfo.FLAG_DEBUGGABLE) != 0) WebView.setWebContentsDebuggingEnabled(true);
        WebHost.configure(web, this, this);
        web.addJavascriptInterface(new PrismBridge(this, web, this), "PrismNative");
        root.addView(web, new FrameLayout.LayoutParams(FrameLayout.LayoutParams.MATCH_PARENT, FrameLayout.LayoutParams.MATCH_PARENT));
        web.loadUrl(WebHost.BASE + "index.html");
        web.requestFocus();
        /* Watchdog: if the page has not started within 12 seconds, reload once, then fall back. */
        PrismApp.app.ui.postDelayed(new Runnable() {
            @Override
            public void run() {
                if (jsReady || isFinishing()) return;
                if (reloads++ < 1) buildWebView();
                else {
                    Toast.makeText(MainActivity.this, "Prism could not start, so the TV's own home screen is open", Toast.LENGTH_LONG).show();
                    PrismBridge.openStockHome(MainActivity.this);
                }
            }
        }, 12000);
    }

    WebView web() { return web; }
    boolean isReady() { return pageReady && web != null; }

    void markReady() {
        jsReady = true;
        PrismApp.app.clearCrashes();
        if (pendingSleep) { pendingSleep = false; js("Prism.onSleep(true)"); }
    }

    @Override
    public void pageFinished() { pageReady = true; }

    @Override
    public void rendererGone() {
        /* The web engine crashed or was stopped for memory. Start it again. */
        PrismApp.app.ui.post(new Runnable() {
            @Override
            public void run() { if (!isFinishing()) buildWebView(); }
        });
    }

    private void hideSystemBars() {
        getWindow().getDecorView().setSystemUiVisibility(
                View.SYSTEM_UI_FLAG_LAYOUT_STABLE | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
                        | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
                        | View.SYSTEM_UI_FLAG_FULLSCREEN | View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY);
    }

    @Override
    protected void onResume() {
        super.onResume();
        PrismApp.main = this;
        PrismApp.foreground = true;
        hideSystemBars();
        if (web != null) web.requestFocus();
        js("Prism.onResume()");
    }

    @Override
    protected void onPause() {
        super.onPause();
        PrismApp.foreground = false;
        js("Prism.onPause()");
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        if (!handleIntent(intent) && intent != null && Intent.ACTION_MAIN.equals(intent.getAction())) js("Prism.onHome()");
    }

    /** Returns true when the intent asked for something specific (the night switch-off countdown). */
    private boolean handleIntent(Intent intent) {
        if (intent != null && intent.getBooleanExtra("sleep", false)) {
            intent.removeExtra("sleep");
            if (jsReady) js("Prism.onSleep(true)"); else pendingSleep = true;
            return true;
        }
        return false;
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (requestCode == PrismBridge.VOICE_REQUEST && resultCode == RESULT_OK && data != null) {
            ArrayList<String> r = data.getStringArrayListExtra(RecognizerIntent.EXTRA_RESULTS);
            if (r != null && !r.isEmpty()) js("Prism.onVoice(" + JSONObject.quote(r.get(0)) + ")");
        }
    }

    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        if (hasFocus) hideSystemBars();
    }

    @Override
    public boolean dispatchKeyEvent(KeyEvent e) {
        int code = e.getKeyCode();
        if (code == KeyEvent.KEYCODE_BACK || code == KeyEvent.KEYCODE_ESCAPE) {
            if (e.getAction() == KeyEvent.ACTION_UP && !e.isCanceled()) js("Prism.onBack()");
            return true; /* A home screen never closes on Back. */
        }
        if (code == KeyEvent.KEYCODE_MENU || code == KeyEvent.KEYCODE_INFO) {
            if (e.getAction() == KeyEvent.ACTION_UP) js("Prism.onMenu()");
            return true;
        }
        if (code == KeyEvent.KEYCODE_SEARCH || code == KeyEvent.KEYCODE_VOICE_ASSIST) {
            return super.dispatchKeyEvent(e);
        }
        return super.dispatchKeyEvent(e);
    }

    @Override
    protected void onDestroy() {
        if (PrismApp.main == this) PrismApp.main = null;
        if (packageReceiver != null) {
            try { unregisterReceiver(packageReceiver); } catch (IllegalArgumentException ignored) { }
        }
        if (web != null) {
            web.removeJavascriptInterface("PrismNative");
            web.destroy();
            web = null;
        }
        super.onDestroy();
    }

    void js(final String call) {
        if (web == null || !pageReady) return;
        runOnUiThread(new Runnable() {
            @Override
            public void run() { if (web != null) web.evaluateJavascript("window.Prism && " + call, (ValueCallback<String>) null); }
        });
    }

    private void registerPackageReceiver() {
        packageReceiver = new BroadcastReceiver() {
            @Override
            public void onReceive(Context c, Intent i) {
                Uri data = i.getData();
                if (data != null) PrismApp.app.catalog.forget(data.getSchemeSpecificPart());
                js("Prism.onAppsChanged()");
            }
        };
        IntentFilter f = new IntentFilter();
        f.addAction(Intent.ACTION_PACKAGE_ADDED);
        f.addAction(Intent.ACTION_PACKAGE_REMOVED);
        f.addAction(Intent.ACTION_PACKAGE_CHANGED);
        f.addAction(Intent.ACTION_PACKAGE_REPLACED);
        f.addDataScheme("package");
        if (Build.VERSION.SDK_INT >= 33) registerReceiver(packageReceiver, f, 2 /* RECEIVER_EXPORTED */);
        else registerReceiver(packageReceiver, f);
    }
}
