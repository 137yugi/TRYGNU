# Deploy

## GitHub Pages

GitHub Pages 用の成果物は `dist/web` に生成します。

```bash
bash scripts/build_web_dist.sh dist/web
```

このスクリプトは Vite build 後に `scripts/verify_pages_bundle.mjs` を実行し、次を検査します。

- `index.html`、`terminal-live.html`、`agency.html`、`manifest.webmanifest` が存在すること
- `index.html` が現在の Vite hash chunk 名を固定せず、`./assets/index-*.js` と `./assets/index-*.css` を参照していること
- HTML、CSS、manifest、source map 参照先が bundle 内に存在すること
- GitHub Pages のサブパス配信で壊れる root-relative URL を含まないこと
- 旧特殊発動の文字列が成果物に残っていないこと

GitHub Actions は `.github/workflows/deploy-pages.yml` で同じスクリプトを `$GITHUB_WORKSPACE/dist/web` に対して実行し、検証済みの `dist/web` を Pages artifact としてアップロードします。
