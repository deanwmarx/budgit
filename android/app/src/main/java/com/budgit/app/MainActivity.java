package com.example.app;

import android.os.Bundle;
import android.view.View;
import androidx.annotation.Nullable;
import androidx.core.view.WindowInsetsControllerCompat;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(@Nullable Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
    }

    @Override
    public void onResume() {
        super.onResume();

        // Detect system dark mode
        int nightModeFlags = getResources().getConfiguration().uiMode
                & android.content.res.Configuration.UI_MODE_NIGHT_MASK;
        boolean isDark =
                (nightModeFlags == android.content.res.Configuration.UI_MODE_NIGHT_YES);

        // Adjust icon colors for system bars
        setSystemBarIconContrast(!isDark);
    }

    private void setSystemBarIconContrast(boolean darkIcons) {
        View decor = getWindow().getDecorView();
        WindowInsetsControllerCompat controller =
                new WindowInsetsControllerCompat(getWindow(), decor);

        // true = dark icons on light bg, false = light icons on dark bg
        controller.setAppearanceLightStatusBars(darkIcons);
        controller.setAppearanceLightNavigationBars(darkIcons);
    }
}