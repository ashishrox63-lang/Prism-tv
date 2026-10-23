package app.prism.tvhome;

import android.annotation.SuppressLint;
import android.content.Context;
import android.net.Uri;
import android.view.View;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import java.io.ByteArrayInputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.util.HashMap;
import java.util.Map;

/** Shared WebView setup and the local file server behind https://prism.local/ for both Home and the screensaver. */
final class WebHost {

    static final String HOST = "prism.local";
    static final String BASE = "https://" + HOST + "/";
    static final int VOID = 0xFF000000;

    interface Events {
        void pageFinished();
        void rendererGone();
    }

    private WebHost() { }

    @SuppressLint("SetJavaScriptEnabled")
    static void configure(WebView web, final Context ctx, final Events events) {
        web.setBackgroundColor(VOID);
        web.setLayerType(View.LAYER_TYPE_HARDWARE, null);
        web.setFocusable(true);
        web.setFocusableInTouchMode(true);
        web.setVerticalScrollBarEnabled(false);
        web.setHorizontalScrollBarEnabled(false);
        web.setOverScrollMode(View.OVER_SCROLL_NEVER);
        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setDatabaseEnabled(true);
        s.setAllowFileAccess(false);
        s.setAllowContentAccess(false);
        s.setSupportZoom(false);
        s.setBuiltInZoomControls(false);
        s.setTextZoom(100);
        s.setUseWideViewPort(true);
        s.setLoadWithOverviewMode(true);
        s.setMediaPlaybackRequiresUserGesture(false);
        s.setMixedContentMode(WebSettings.MIXED_CONTENT_COMPATIBILITY_MODE);
        web.setWebViewClient(new WebViewClient() {
            @Override
            public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
                return serve(ctx, request.getUrl());
            }

            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                return !HOST.equals(request.getUrl().getHost());
            }

            @Override
            public void onPageFinished(WebView view, String url) {
                if (events != null) events.pageFinished();
            }

            @Override
            public boolean onRenderProcessGone(WebView view, android.webkit.RenderProcessGoneDetail detail) {
                if (events != null) events.rendererGone();
                return true;
            }
        });
    }

    static WebResourceResponse serve(Context ctx, Uri uri) {
        if (uri == null || !HOST.equals(uri.getHost())) return null;
        String path = uri.getPath();
        if (path == null || path.equals("/")) path = "/index.html";
        try {
            AppCatalog cat = PrismApp.app.catalog;
            if (path.startsWith("/app-icon/")) return png(cat.icon(path.substring(10)));
            if (path.startsWith("/app-banner/")) return png(cat.banner(path.substring(12)));
            if (path.startsWith("/now-art")) return png(NowPlaying.artPng());
            if (path.startsWith("/user-photos/")) {
                File f = Photos.file(ctx, path.substring(13));
                if (f == null || !f.exists()) return notFound();
                return response("image/jpeg", new FileInputStream(f), true);
            }
            if (path.contains("..")) return notFound();
            InputStream in = ctx.getAssets().open("web" + path);
            return response(mime(path), in, !path.endsWith(".html"));
        } catch (IOException e) {
            return notFound();
        }
    }

    private static WebResourceResponse png(byte[] b) { return b == null ? notFound() : response("image/png", new ByteArrayInputStream(b), true); }

    static WebResourceResponse response(String mime, InputStream in, boolean cache) {
        Map<String, String> headers = new HashMap<String, String>();
        headers.put("Cache-Control", cache ? "max-age=86400" : "no-cache");
        headers.put("Access-Control-Allow-Origin", "*");
        String enc = mime.startsWith("text/") || mime.endsWith("javascript") || mime.endsWith("json") || mime.endsWith("svg+xml") ? "utf-8" : null;
        return new WebResourceResponse(mime, enc, 200, "OK", headers, in);
    }

    static WebResourceResponse notFound() {
        return new WebResourceResponse("text/plain", "utf-8", 404, "Not Found", new HashMap<String, String>(), new ByteArrayInputStream(new byte[0]));
    }

    static String mime(String p) {
        String l = p.toLowerCase();
        if (l.endsWith(".html")) return "text/html";
        if (l.endsWith(".css")) return "text/css";
        if (l.endsWith(".js")) return "application/javascript";
        if (l.endsWith(".svg")) return "image/svg+xml";
        if (l.endsWith(".png")) return "image/png";
        if (l.endsWith(".jpg") || l.endsWith(".jpeg")) return "image/jpeg";
        if (l.endsWith(".woff2")) return "font/woff2";
        if (l.endsWith(".json")) return "application/json";
        return "application/octet-stream";
    }
}
