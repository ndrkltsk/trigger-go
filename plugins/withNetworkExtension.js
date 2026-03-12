const { withXcodeProject } = require("expo/config-plugins");

const withNetworkExtension = (config) => {
  return withXcodeProject(config, (config) => {
    const project = config.modResults;
    const targetUuid = project.getFirstTarget().uuid;
    const buildConfigs =
      project.pbxNativeTargetSection()[targetUuid].buildConfigurationList;
    const configList =
      project.pbxXCConfigurationList()[buildConfigs].buildConfigurations;

    for (const { value } of configList) {
      const buildSettings =
        project.pbxXCBuildConfigurationSection()[value].buildSettings;
      const frameworks = buildSettings.OTHER_LDFLAGS || ["$(inherited)"];
      if (!frameworks.includes("-framework")) {
        frameworks.push("-framework", '"NetworkExtension"');
      } else {
        const hasIt = frameworks.some(
          (f, i) =>
            f === "-framework" &&
            frameworks[i + 1]?.replace(/"/g, "") === "NetworkExtension"
        );
        if (!hasIt) {
          frameworks.push("-framework", '"NetworkExtension"');
        }
      }
      buildSettings.OTHER_LDFLAGS = frameworks;
    }

    return config;
  });
};

module.exports = withNetworkExtension;
