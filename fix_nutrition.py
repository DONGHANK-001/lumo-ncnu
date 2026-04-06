import re

file_path = r'frontend/src/app/page.tsx'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Fix 1: Change background to backgroundImage + bgcolor for the nutrition card
old = """                        background: mode === 'dark'
                            ? `linear-gradient(135deg, ${theme.palette.background.default} 0%, #2E7D32 100%)`
                            : 'linear-gradient(135deg, #1B5E20 0%, #2E7D32 100%)',"""

new = """                        bgcolor: 'transparent',
                        backgroundImage: mode === 'dark'
                            ? `linear-gradient(135deg, ${theme.palette.background.default} 0%, #2E7D32 100%)`
                            : 'linear-gradient(135deg, #2E7D32 0%, #43A047 100%)',"""

if old in content:
    content = content.replace(old, new)
    print("Fix 1 OK: background -> backgroundImage + bgcolor:transparent")
else:
    print("Fix 1 FAILED: old string not found")

# Fix 2: Light mode icon color from #A5D6A7 to #C8E6C9 (only for the nutrition card Restaurant icon)
old2 = "color: mode === 'dark' ? '#66BB6A' : '#A5D6A7'"
new2 = "color: mode === 'dark' ? '#66BB6A' : '#C8E6C9'"

if old2 in content:
    content = content.replace(old2, new2)
    print("Fix 2 OK: icon color updated")
else:
    print("Fix 2 FAILED: old string not found")

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Done!")
