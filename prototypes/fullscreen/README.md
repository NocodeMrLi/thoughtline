# G7 public fullscreen probe — isolated prototype

This branch starts from the unchanged 0.0.13 candidate. These files are neither imported by `src` nor included by the package builder. They do not suppress production hover and do not change unknown-state policy.

A persistent process accepts newline `sample` requests and emits one JSON result per request; `quit` ends it. It blocks on stdin between requests. It does not log window titles, bundle names, pixels or note data. It does not request Accessibility or screen-recording permission. Mac tests record the existing screen-capture preflight grant; when it is true, they cannot establish operation on an unprivileged machine.

## Build and test

Mac (bundled Node 24.19): `node prototypes/fullscreen/build-mac.cjs`, then `node prototypes/fullscreen/mac-workflow.cjs`. The compiler requires an explicit SDK sysroot; the script resolves it through xcrun. CMake can build the same source if installed.

Windows: `cmake -S prototypes/fullscreen -B prototypes/fullscreen/build -A x64`; `cmake --build prototypes/fullscreen/build --config Release`; `ctest --test-dir prototypes/fullscreen/build -C Release --output-on-failure`. Branch-specific GitHub workflow compiles both executables and records a runner query. A headless runner query is API availability evidence, not physical Windows fullscreen acceptance.

Mac request: `sample <CG display ID, or 0 for primary> <expected fixture PID, or 0>`. The expected PID only produces a boolean match; it does not replace the observed frontmost application. Windows request: `sample` targets the pointer monitor.

## Signals and limits

Mac uses NSWorkspace.frontmostApplication, on-screen CoreGraphics window metadata and display bounds, all in the same coordinate system. One eligible frontmost-app window overlapping the target display returns clear for partial coverage, blocked for complete coverage. Multiple eligible windows, another display, missing geometry/app, invalid display or inaccessible metadata return unknown. Coverage is conservative geometry; it does not prove native fullscreen Space membership. A maximized app with auto-hidden system bars can be misclassified. Background fullscreen windows, desktop/Finder, multi-window and mixed-monitor cases are not solved. The code intentionally avoids expanding ambiguous evidence into clear.

Windows first calls SHQueryUserNotificationState: NOT_PRESENT/BUSY/D3D_FULLSCREEN/PRESENTATION block globally. ACCEPTS/QUIET_TIME/APP alone allow a foreground geometry check; the latter two are not fullscreen indicators. API failure or invalid enum returns unknown. With successful per-monitor-v2 DPI context, DWM extended frame bounds are compared with the pointer monitor's physical coordinates. Coverage may conservatively block maximized/autohidden taskbar cases. A front window on another display is unknown. Public notification state is global, not per-monitor, and cannot establish all games/presentations.

No result changes the candidate's manual pause, draft, shortcut, or explicit entry behavior. Production integration needs fresh-state/timeout/target-change handling, separate pause reasons, restored dwell, automatic peek, drag cancellation and draft safety checks plus physical Windows and multi-app/display validation. Unknown must not become a new global default suppression before availability and entry reachability are proved.

Sources: [Microsoft query API](https://learn.microsoft.com/en-us/windows/win32/api/shellapi/nf-shellapi-shqueryusernotificationstate), [state enum](https://learn.microsoft.com/en-us/windows/win32/api/shellapi/ne-shellapi-query_user_notification_state), [DWM bounds](https://learn.microsoft.com/en-us/windows/win32/api/dwmapi/ne-dwmapi-dwmwindowattribute), [Apple window list](https://developer.apple.com/documentation/coregraphics/cgwindowlistcopywindowinfo(_:_:)), [frontmost app](https://developer.apple.com/documentation/appkit/nsworkspace/frontmostapplication). Apple public SDK headers were also used for signature validation.
