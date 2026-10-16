# Populate the prospect before design

1. Verify the approved destination repository and its main branch. If it already contains the starter, use it directly. Preserve existing work. Do not overwrite another prospect.
2. Prefer an existing GitHub template copy or an authenticated Git push. Verify access before implementation; do not spend time repairing unavailable CLI authentication when the connected GitHub tools work.
3. For an empty repository or README-only initial commit, run scripts/start-prospect.mjs with --repo, --name, and --dir. It creates a separate checkout and a temporary JSON bundle. It does not publish automatically.
4. With connector fallback, fetch the destination main commit once. Read the bundle once into the orchestration runtime. Create one tree with all text entries using inline content and the destination base tree (or preserve its existing file entries). For any binary files create blobs, then include their SHA entries. Create one commit with the current destination head as parent, then update main with expected_sha and force=false. Do not upload each text file separately or repeatedly print payload chunks. For an entirely empty repo with no branch, use the GitHub template flow or initialize its README first.
5. Verify the new remote commit. Only then install dependencies, research, and design. Publish page changes in a later batched commit. Never place business assets in the shared starter.

Cloudflare Git builds: empty build command, npx wrangler deploy. npm ci runs prepare, which builds dist/. Authentication and environment secrets stay outside Git.
