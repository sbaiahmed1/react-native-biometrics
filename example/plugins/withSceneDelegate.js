const { withAppDelegate } = require('expo/config-plugins');

/**
 * iOS 27 terminates apps that do not adopt the UIScene lifecycle, and the Expo
 * template's AppDelegate still creates its window without a scene.
 *
 * `app.json` declares the scene manifest (`ios.infoPlist`); this plugin adds
 * the scene delegate class it names, which attaches the window the AppDelegate
 * already created to the connecting scene.
 */
const MARKER = '@objc(SceneDelegate)';

const SCENE_DELEGATE = `
// Added by example/plugins/withSceneDelegate.js
${MARKER}
class SceneDelegate: UIResponder, UIWindowSceneDelegate {
  func scene(
    _ scene: UIScene,
    willConnectTo session: UISceneSession,
    options connectionOptions: UIScene.ConnectionOptions
  ) {
    guard let windowScene = scene as? UIWindowScene,
      let window = (UIApplication.shared.delegate as? AppDelegate)?.window
    else { return }
    window.windowScene = windowScene
    window.makeKeyAndVisible()
  }
}
`;

module.exports = function withSceneDelegate(config) {
  return withAppDelegate(config, (mod) => {
    if (mod.modResults.language !== 'swift') {
      throw new Error('withSceneDelegate expects a Swift AppDelegate');
    }
    if (!mod.modResults.contents.includes(MARKER)) {
      mod.modResults.contents += SCENE_DELEGATE;
    }
    return mod;
  });
};
