# VS Code Extensions Notes

## Prettier Extension Migration

⚠️ **Important:** The Prettier extension is migrating from `esbenp.prettier-vscode` to `prettier.prettier-vscode`.

### Current Status (2025)
- **Use**: `esbenp.prettier-vscode` (stable, recommended)
- **Avoid**: `prettier.prettier-vscode` v12+ (unstable, use with caution)

### Migration Plan
1. Version 12.x is currently **not stable** - wait for stable release
2. Once v12 is stable, both extensions will be published
3. The old `esbenp.prettier-vscode` will be deprecated
4. We'll update [.vscode/settings.json](.vscode/settings.json) and [.vscode/extensions.json](.vscode/extensions.json) at that time

### When to Migrate
Monitor the [Prettier VS Code extension changelog](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode) for:
- Announcement that v12 is stable
- Official deprecation notice for `esbenp.prettier-vscode`

### Migration Steps (When Ready)
1. Update `.vscode/extensions.json`: Change `"esbenp.prettier-vscode"` → `"prettier.prettier-vscode"`
2. Update `.vscode/settings.json`: Change all `"esbenp.prettier-vscode"` → `"prettier.prettier-vscode"`
3. Uninstall old extension: `code --uninstall-extension esbenp.prettier-vscode`
4. Install new extension: `code --install-extension prettier.prettier-vscode`
5. Test formatting across all file types
6. Commit changes

---

**Last Updated**: December 2025
**References**:
- [Prettier VS Code Extension](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode)
- [New Publisher (preview)](https://marketplace.visualstudio.com/items?itemName=prettier.prettier-vscode)
