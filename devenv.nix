{
  pkgs,
  lib,
  config,
  ...
}:
{
  # https://devenv.sh/languages/
  languages.javascript = {
    enable = true;
    yarn = {
      enable = true;
      install.enable = true;
    };
  };

  # https://devenv.sh/packages/
  packages = [
    pkgs.tailwindcss
#    pkgs.nodePackages.angular-cli
  ];

  # See full reference at https://devenv.sh/reference/options/
}

