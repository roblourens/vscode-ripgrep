#!/bin/bash
# Adapted from https://github.com/BurntSushi/ripgrep/blob/master/ci/install.sh

# install stuff needed for the `script` phase

# Where rustup gets installed.
export PATH="$PATH:$HOME/.cargo/bin"

set -ex

. "$(dirname $0)/utils.sh"

install_rustup() {
    curl https://sh.rustup.rs -sSf \
      | sh -s -- -y --default-toolchain="$RUST_VERSION"
    source /usr/local/cargo/env
    rustc -V
    cargo -V
}

install_targets() {
    if [ $(host) != "$TARGET" ]; then
        rustup target add $TARGET
    fi
}

install_osx_dependencies() {
    if ! is_osx; then
      return
    fi

    brew install asciidoc docbook-xsl
}

install_linux_dependencies() {
    if ! is_linux; then
        return
    fi
    sudo apt-get update
    sudo apt-get install -y musl-tools

    if is_arm; then
        sudo apt-get install gcc-4.8-arm-linux-gnueabihf
        sudo apt-get install gcc-arm-linux-gnueabihf
        sudo apt-get install binutils-arm-linux-gnueabihf
        sudo apt-get install libc6-armhf-cross
        sudo apt-get install libc6-dev-armhf-cross
    fi
}

configure_cargo() {
    local prefix=$(gcc_prefix)
    if [ -n "${prefix}" ]; then
        local gcc_suffix=
        if [ -n "$GCC_VERSION" ]; then
          gcc_suffix="-$GCC_VERSION"
        fi
        local gcc="${prefix}gcc${gcc_suffix}"

        # information about the cross compiler
        "${gcc}" -v

        # tell cargo which linker to use for cross compilation
        mkdir -p .cargo
        cat >>.cargo/config <<EOF
[target.$TARGET]
linker = "${gcc}"
EOF
    fi
}

main() {
    printenv

    install_linux_dependencies
    install_osx_dependencies
    install_rustup
    install_targets
    configure_cargo
}

main