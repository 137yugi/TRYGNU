# GitHub Pages 自動公開（常に最新版）

このプロジェクトは静的配信可能です。  
`main` ブランチに push するたび、GitHub Actions が自動で最新を公開します。

## 1. 事前準備

1. GitHub にこのプロジェクト用のリポジトリを作成する。
2. ローカルで remote を設定する。

   ```bash
   git remote add origin <YOUR_GITHUB_REPO_URL>
   ```

## 2. 初回 push

```bash
git add .
git commit -m "setup: github pages auto deploy"
git push -u origin main
```

## 3. Pages を有効化

1. GitHub リポジトリの `Settings` -> `Pages` を開く。
2. `Build and deployment` で Source が `GitHub Actions` になっていることを確認する。
3. Actions が完了すると公開URLが出る。
   - 例: `https://<user>.github.io/<repo>/`

## 4. 以後の運用

`main` に push するだけで最新版に更新される。

```bash
git add .
git commit -m "update: latest game tuning"
git push
```

## 補足

- 配信用のローカルWebhook（TikFinity bridge）はローカル向け機能。公開サイトでは通常OFF運用が安全。
- 公開先に含めるファイルは `scripts/build_web_dist.sh` で制御している。
