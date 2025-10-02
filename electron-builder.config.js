module.exports = {
  appId: 'com.intelligentlibrary.app',
  productName: 'Intelligent Library',
  directories: {
    output: 'dist-electron'
  },
  files: [
    'dist/**/*',
    'electron/main.js',
    'public/pdf.worker.min.mjs',
    'node_modules/**/*'
  ],
  extraMetadata: {
    main: 'electron/main.js'
  },
  win: {
    target: 'nsis',
    icon: 'public/favicon.ico'
  },
  mac: {
    target: 'dmg',
    icon: 'public/favicon.ico'
  },
  linux: {
    target: 'AppImage',
    icon: 'public/favicon.ico'
  },
  nsis: {
    oneClick: false,
    allowToChangeInstallationDirectory: true,
    createDesktopShortcut: true,
    createStartMenuShortcut: true
  }
};