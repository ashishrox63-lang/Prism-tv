package app.prism.tvhome;

import android.accessibilityservice.AccessibilityService;
import android.os.Build;
import android.view.accessibility.AccessibilityEvent;

/**
 * Optional accessibility service. Turned on by you in Settings, Device Preferences, Accessibility.
 * Prism uses it for three things only: switching the TV off at night, and the phone remote's
 * Back and Home buttons while another app is open. It reads no screen content.
 */
public class PrismAccess extends AccessibilityService {

    static volatile PrismAccess instance;

    @Override
    protected void onServiceConnected() { instance = this; }

    @Override
    public void onAccessibilityEvent(AccessibilityEvent event) { }

    @Override
    public void onInterrupt() { }

    @Override
    public void onDestroy() {
        if (instance == this) instance = null;
        super.onDestroy();
    }

    /** Puts the TV into standby. Returns false when the service is off. */
    static boolean sleep() {
        PrismAccess a = instance;
        if (a == null || Build.VERSION.SDK_INT < 28) return false;
        return a.performGlobalAction(GLOBAL_ACTION_LOCK_SCREEN);
    }

    static boolean global(String what) {
        PrismAccess a = instance;
        if (a == null) return false;
        if ("back".equals(what)) return a.performGlobalAction(GLOBAL_ACTION_BACK);
        if ("home".equals(what)) return a.performGlobalAction(GLOBAL_ACTION_HOME);
        return false;
    }
}
