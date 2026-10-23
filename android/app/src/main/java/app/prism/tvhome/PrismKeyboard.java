package app.prism.tvhome;

import android.content.res.ColorStateList;
import android.graphics.Color;
import android.graphics.Typeface;
import android.graphics.drawable.GradientDrawable;
import android.graphics.drawable.StateListDrawable;
import android.inputmethodservice.InputMethodService;
import android.view.Gravity;
import android.view.KeyEvent;
import android.view.View;
import android.view.inputmethod.EditorInfo;
import android.view.inputmethod.InputConnection;
import android.widget.Button;
import android.widget.LinearLayout;
import android.widget.TextView;

import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;

/**
 * Prism Keyboard. A simple on-screen keyboard you can use with the remote, which also lets you type
 * from the phone remote into any app's text box (Netflix search, YouTube, sign-in forms).
 */
public class PrismKeyboard extends InputMethodService {

    static volatile PrismKeyboard instance;
    private volatile boolean inputActive = false;
    private boolean caps = false;
    private LinearLayout keys;

    @Override
    public void onCreate() { super.onCreate(); instance = this; }

    @Override
    public void onDestroy() { if (instance == this) instance = null; super.onDestroy(); }

    @Override
    public void onStartInput(EditorInfo attribute, boolean restarting) { super.onStartInput(attribute, restarting); inputActive = true; }

    @Override
    public void onFinishInput() { super.onFinishInput(); inputActive = false; }

    @Override
    public View onCreateInputView() {
        float d = getResources().getDisplayMetrics().density;
        LinearLayout root = new LinearLayout(this);
        root.setOrientation(LinearLayout.VERTICAL);
        root.setBackgroundColor(0xF01C1C1E);
        root.setPadding((int) (24 * d), (int) (12 * d), (int) (24 * d), (int) (16 * d));
        TextView hint = new TextView(this);
        String ip = PrismApp.ip();
        hint.setText(ip == null ? "Prism Keyboard" : "Prism Keyboard. You can also type on your phone at http://" + ip + ":" + PrismApp.PORT);
        hint.setTextColor(0x99EBEBF5);
        hint.setTextSize(12);
        hint.setPadding(0, 0, 0, (int) (8 * d));
        root.addView(hint);
        keys = new LinearLayout(this);
        keys.setOrientation(LinearLayout.VERTICAL);
        root.addView(keys);
        build();
        return root;
    }

    private void build() {
        keys.removeAllViews();
        String[] rows = { "1234567890", caps ? "QWERTYUIOP" : "qwertyuiop", caps ? "ASDFGHJKL@" : "asdfghjkl@", caps ? "ZXCVBNM.-_" : "zxcvbnm.-_" };
        for (String r : rows) {
            LinearLayout row = row();
            for (int i = 0; i < r.length(); i++) row.addView(key(String.valueOf(r.charAt(i)), 1));
            keys.addView(row);
        }
        LinearLayout last = row();
        last.addView(key(caps ? "abc" : "ABC", 1.5f));
        last.addView(key("Space", 4));
        last.addView(key("Delete", 1.8f));
        last.addView(key("Done", 1.8f));
        keys.addView(last);
    }

    private LinearLayout row() {
        LinearLayout r = new LinearLayout(this);
        r.setOrientation(LinearLayout.HORIZONTAL);
        r.setGravity(Gravity.CENTER);
        return r;
    }

    private Button key(final String label, float weight) {
        float d = getResources().getDisplayMetrics().density;
        Button b = new Button(this);
        b.setText(label);
        b.setAllCaps(false);
        b.setTextSize(label.length() > 1 ? 14 : 17);
        b.setTypeface(Typeface.DEFAULT, Typeface.NORMAL);
        b.setTextColor(new ColorStateList(new int[][] { { android.R.attr.state_focused }, {} }, new int[] { 0xFF1D1D1F, Color.WHITE }));
        StateListDrawable bg = new StateListDrawable();
        bg.addState(new int[] { android.R.attr.state_focused }, rounded(Color.WHITE, 10 * d));
        bg.addState(new int[] {}, rounded(0xFF3A3A3C, 10 * d));
        b.setBackground(bg);
        b.setFocusable(true);
        b.setPadding(0, 0, 0, 0);
        LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(0, (int) (40 * d), weight);
        lp.setMargins((int) (3 * d), (int) (3 * d), (int) (3 * d), (int) (3 * d));
        b.setLayoutParams(lp);
        b.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) { press(label); }
        });
        return b;
    }

    private static GradientDrawable rounded(int color, float r) {
        GradientDrawable g = new GradientDrawable();
        g.setColor(color);
        g.setCornerRadius(r);
        return g;
    }

    private void press(String label) {
        InputConnection ic = getCurrentInputConnection();
        if (ic == null) return;
        if ("Space".equals(label)) ic.commitText(" ", 1);
        else if ("Delete".equals(label)) sendDownUpKeyEvents(KeyEvent.KEYCODE_DEL);
        else if ("Done".equals(label)) { if (!sendDefaultEditorAction(true)) requestHideSelf(0); }
        else if ("ABC".equals(label) || "abc".equals(label)) { caps = !caps; build(); }
        else ic.commitText(label, 1);
    }

    /* ---------- Called by the phone remote ---------- */

    static boolean type(final String text, final boolean enter) {
        final PrismKeyboard k = instance;
        if (k == null || !k.inputActive) return false;
        return onMain(new Runnable() {
            @Override
            public void run() {
                InputConnection ic = k.getCurrentInputConnection();
                if (ic == null) return;
                ic.commitText(text, 1);
                if (enter) k.sendDefaultEditorAction(true);
            }
        });
    }

    static boolean key(final int code) {
        final PrismKeyboard k = instance;
        if (k == null || !k.inputActive) return false;
        return onMain(new Runnable() {
            @Override
            public void run() { k.sendDownUpKeyEvents(code); }
        });
    }

    private static boolean onMain(final Runnable r) {
        final CountDownLatch l = new CountDownLatch(1);
        PrismApp.app.ui.post(new Runnable() {
            @Override
            public void run() { try { r.run(); } finally { l.countDown(); } }
        });
        try { return l.await(2, TimeUnit.SECONDS); } catch (InterruptedException e) { return false; }
    }
}
