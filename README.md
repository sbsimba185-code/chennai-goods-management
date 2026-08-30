# Chennai Goods Management

Static website for the Chennai goods register. It uses Supabase Auth and the protected Supabase database.

## Publish with GitHub Pages

1. Create a new **private** GitHub repository named `chennai-goods-management`.
2. Upload the contents of this folder to the repository root.
3. In the repository, open **Settings → Pages**.
4. Under **Build and deployment**, select **Deploy from a branch**.
5. Select the `main` branch and `/ (root)`, then save.
6. Copy the published `https://...github.io/.../` address.
7. In Supabase, open **Authentication → URL Configuration** and set that address as the Site URL. Add it to Redirect URLs too.

Only the Supabase publishable key is included in the website. The database is protected by Row Level Security and requires the office account to sign in.
