# Changelog

## [0.2.0](https://github.com/nam-hle/md-task/compare/md-task-v0.1.0...md-task-v0.2.0) (2026-05-24)


### Features

* add --note option to update command ([70e7160](https://github.com/nam-hle/md-task/commit/70e71605c98a68d0394f2af7146b03a9f679e81b))
* add --quiet flag for minimal machine output ([390118f](https://github.com/nam-hle/md-task/commit/390118f68c840dd09354842f96920de4bccf5430))
* add --sort option to list command ([248b11b](https://github.com/nam-hle/md-task/commit/248b11baf5c7d8c35583249f3841838ffcb00f07))
* add batch command for bulk operations via JSON stdin ([096d22b](https://github.com/nam-hle/md-task/commit/096d22b9928794ead3ffea7cad78a7e67daee6b9))
* add configurable status transitions with --force bypass ([7a86a62](https://github.com/nam-hle/md-task/commit/7a86a62e791d99fe912fb0cc3bdf7fd21bbd9a6c))
* add configurable task schema via YAML frontmatter ([8d658eb](https://github.com/nam-hle/md-task/commit/8d658ebef1f658f52ebcac1fc1aaace55dfadedf))
* add done and start shortcut commands ([ba97260](https://github.com/nam-hle/md-task/commit/ba97260b9eb7f1567d525bf054ff833bb6562eb2))
* add move command for transition-aware status changes ([1f6f0b3](https://github.com/nam-hle/md-task/commit/1f6f0b361a9d00e923df45c3f1c0caa4a40f1ef2))
* add next command with dependency awareness ([460ac1f](https://github.com/nam-hle/md-task/commit/460ac1faa49c7916478d93a7d183122aa4cf8899))
* add search command ([b202c26](https://github.com/nam-hle/md-task/commit/b202c261fb36078983546e4498484e4789cdfeb4))
* add specific exit codes (0=success, 1=error, 2=not-found) ([8fb64a9](https://github.com/nam-hle/md-task/commit/8fb64a9da4fc6c1ce95f6672e18cdca83f9d874c))
* add stats command ([97a14dd](https://github.com/nam-hle/md-task/commit/97a14dd689f2464a72c1accb4b95fca21fbc1eea))
* add task dependencies (--depends-on) ([77dd4c7](https://github.com/nam-hle/md-task/commit/77dd4c771676759b5ce3b2c85644fac4eaad4da0))
* add updated timestamp to tasks ([8dca6ca](https://github.com/nam-hle/md-task/commit/8dca6ca6e173b2670c5ff98b7f833f504c2cf30e))
* initial implementation of mtask CLI ([aa0602d](https://github.com/nam-hle/md-task/commit/aa0602d97d61c7be77d9feb6ab63f113197e4c6d))
* schema-aware CLI help text with dynamic allowed values ([42c353d](https://github.com/nam-hle/md-task/commit/42c353d63871be2fb16816ebf94222ff58dad8ee))
* strict prefixed IDs, frontmatter field ordering, and format command ([e46be58](https://github.com/nam-hle/md-task/commit/e46be58d9e49c74e303476688c137db7ff0c5d23))
* support multi-value filters in list command ([8ea4f00](https://github.com/nam-hle/md-task/commit/8ea4f00e906f236bd9ad653e4415b77fd2713f04))


### Bug Fixes

* case-insensitive field validation preserving schema casing ([#1](https://github.com/nam-hle/md-task/issues/1)) ([8116524](https://github.com/nam-hle/md-task/commit/81165243994d61f8dc786fda85d1d246305a4da8))
* display formatted task IDs in all command output ([60a7981](https://github.com/nam-hle/md-task/commit/60a798132ba2d531880147238204809830287d93))


### Refactors

* minimal CLI surface and convention-over-config ([c27952f](https://github.com/nam-hle/md-task/commit/c27952f6203487ebfee5b607b054e46bebac59f3))
* put tag line immediately after heading, before description ([2898afd](https://github.com/nam-hle/md-task/commit/2898afdc7a7f7228460c04bebb9727e4900b3e46))
* remove done/start commands in favor of move ([56df7e1](https://github.com/nam-hle/md-task/commit/56df7e1a46eb91b47bc533ffddcf530c42aff2c1))
* rename mtask to md-task ([1b6ffe3](https://github.com/nam-hle/md-task/commit/1b6ffe3d512ae964e9cbaa9d0ce9e281ed325361))


### Documentation

* add configurable schema design spec ([ea59f16](https://github.com/nam-hle/md-task/commit/ea59f16e375b63f0cd556ff0147f51b0d7877d8f))
* update CLAUDE.md with AI-boost features ([6a647d5](https://github.com/nam-hle/md-task/commit/6a647d5d0a3c338aee6118db6343e9a23d91975f))
* update md-task skill with output ID, tag-line order, format command ([c96b3f1](https://github.com/nam-hle/md-task/commit/c96b3f14ba944d8bea4a5a9837ae98c701a63723))
* update skill and CLAUDE.md for move command and transitions ([13c95e8](https://github.com/nam-hle/md-task/commit/13c95e82e1237e64b039b80dac23f5aaffaa88bc))
