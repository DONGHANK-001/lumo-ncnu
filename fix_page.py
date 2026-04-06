import pathlib

f = pathlib.Path('frontend/src/app/page.tsx')
content = f.read_text(encoding='utf-8')

# 1. Fix nutrition card dark gradient
old1 = "? 'linear-gradient(135deg, #1a2e1a 0%, #2d4a1e 100%)'\n                            : 'linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%)'"
new1 = "`linear-gradient(135deg, ${theme.palette.background.default} 0%, #2E7D32 100%)`\n                            : 'linear-gradient(135deg, #1B5E20 0%, #2E7D32 100%)'"
assert old1 in content, "Gradient pattern not found!"
content = content.replace(old1, new1)

# 2. Add Restaurant icon + change h5 to h6 in nutrition card
old2 = "<CardContent sx={{ textAlign: 'center', py: 3 }}>\n                        <Typography variant=\"h5\" fontWeight=\"bold\" gutterBottom>\n                            \U0001f37d\ufe0f \u6d3b\u52d5\u98f2\u98df\u6307\u5357"
new2 = "<CardContent sx={{ textAlign: 'center', py: 3 }}>\n                        <Restaurant sx={{ fontSize: 40, color: mode === 'dark' ? '#66BB6A' : '#A5D6A7', mb: 1 }} />\n                        <Typography variant=\"h6\" fontWeight=\"bold\" gutterBottom sx={{ color: mode === 'dark' ? undefined : '#fff' }}>\n                            \U0001f37d\ufe0f \u6d3b\u52d5\u98f2\u98df\u6307\u5357"
assert old2 in content, "Nutrition CardContent pattern not found!"
content = content.replace(old2, new2)

# 3. Fix the body2 color for nutrition card
old3 = "<Typography variant=\"body2\" color=\"text.secondary\">\n                            \u4f9d\u6d3b\u52d5\u985e\u578b\u63a8\u85a6\u6700\u4f73\u98f2\u98df\u8207\u71df\u990a\u88dc\u7d66\u5efa\u8b70"
new3 = "<Typography variant=\"body2\" sx={{ color: mode === 'dark' ? 'text.secondary' : 'rgba(255,255,255,0.85)' }}>\n                            \u4f9d\u6d3b\u52d5\u985e\u578b\u63a8\u85a6\u6700\u4f73\u98f2\u98df\u8207\u71df\u990a\u88dc\u7d66\u5efa\u8b70"
assert old3 in content, "Nutrition body2 pattern not found!"
content = content.replace(old3, new3)

# 4. Add Guide FAB before Updates FAB
old4 = "            {/* Updates FAB */}"
new4 = """            {/* Guide FAB */}
            <Fab
                aria-label="guide"
                component={Link}
                href="/guide"
                sx={{
                    position: 'fixed',
                    bottom: 152,
                    right: 24,
                    zIndex: 1000,
                    bgcolor: mode === 'dark' ? '#7E57C2' : '#6A1B9A',
                    color: '#fff',
                    '&:hover': { bgcolor: mode === 'dark' ? '#5E35B1' : '#4A148C' },
                }}
            >
                <Typography fontSize="1.4rem">\U0001f4d6</Typography>
            </Fab>

            {/* Updates FAB */}"""
assert old4 in content, "Updates FAB pattern not found!"
content = content.replace(old4, new4)

f.write_text(content, encoding='utf-8')
print('All 4 edits applied successfully!')

# Verify
lines = content.split('\n')
for i, line in enumerate(lines):
    if 'background.default' in line and '2E7D32' in line:
        print(f'  [OK] Gradient fix at line {i+1}')
    if 'Guide FAB' in line:
        print(f'  [OK] Guide FAB at line {i+1}')
    if 'Restaurant' in line and '66BB6A' in line:
        print(f'  [OK] Restaurant icon at line {i+1}')
    if "variant=\"h6\"" in line and "活動飲食指南" in content.split('\n')[i+1] if i+1 < len(lines) else False:
        print(f'  [OK] h6 variant at line {i+1}')
