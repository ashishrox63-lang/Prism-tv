package app.prism.tvhome;

import android.service.dreams.DreamService;
import android.webkit.WebView;

/**
 * The TV's system screensaver. Pick it in Settings, Device Preferences, Screen saver.
 * It shows the same scenes as Prism's own screensaver: clock, family photos, weather, art,
 * calendar and family notes. Any button on the remote ends it.
 */
public class PrismDream extends DreamService {

    private WebView web;

    @Override
    public void onAttachedToWindow() {
        super.onAttachedToWindow();
        setInteractive(false);
        setFullscreen(true);
        setScreenBright(true);
        web = new WebView(this);
        WebHost.configure(web, this, null);
        web.addJavascriptInterface(new PrismBridge(this, web, null), "PrismNative");
        setContentView(web);
        web.loadUrl(WebHost.BASE + "index.html?saver=1");
    }

    @Override
    public void onDetachedFromWindow() {
        if (web != null) {
            web.removeJavascriptInterface("PrismNative");
            web.destroy();
            web = null;
        }
        super.onDetachedFromWindow();
    }
}
