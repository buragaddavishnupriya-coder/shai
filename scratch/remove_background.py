import os
from PIL import Image

input_path = r"C:\Users\burag\.gemini\antigravity-ide\brain\367569d4-96c6-4aaa-bd80-a9b4bf04b994\media__1783222495355.png"
output_dir = r"c:\Users\burag\OneDrive\Desktop\shai-district-clone-main\public"

# Ensure output directory exists
os.makedirs(output_dir, exist_ok=True)

img = Image.open(input_path).convert("RGBA")
datas = img.getdata()

# Brand color purple: RGB(147, 51, 234)
purple_color = (147, 51, 234, 255)
white_color = (255, 255, 255, 255)
black_color = (0, 0, 0, 255)
transparent = (0, 0, 0, 0)

# Version 1: Purple Symbol Only (for light header)
# Only keep the top symbol part (where r > 210) and color it purple.
# In the original image, the text "SHAI" is at the bottom (y > 70% of height).
# Let's crop or filter based on pixel position.
width, height = img.size

# 1. logo-symbol-purple.png
symbol_purple = Image.new("RGBA", (width, height))
newData = []
for y in range(height):
    for x in range(width):
        r, g, b, a = img.getpixel((x, y))
        # Keep only the white symbol part (which is at the top/middle, y < height * 0.72)
        if y < height * 0.72 and r > 210 and g > 210 and b > 210:
            newData.append(purple_color)
        else:
            newData.append(transparent)
symbol_purple.putdata(newData)
# Let's crop the transparent padding to make it a tight fit
bbox = symbol_purple.getbbox()
if bbox:
    symbol_purple.crop(bbox).save(os.path.join(output_dir, "logo-symbol-purple.png"), "PNG")
    print("Generated logo-symbol-purple.png")

# 2. logo-symbol-white.png
symbol_white = Image.new("RGBA", (width, height))
newData = []
for y in range(height):
    for x in range(width):
        r, g, b, a = img.getpixel((x, y))
        if y < height * 0.72 and r > 210 and g > 210 and b > 210:
            newData.append(white_color)
        else:
            newData.append(transparent)
symbol_white.putdata(newData)
bbox = symbol_white.getbbox()
if bbox:
    symbol_white.crop(bbox).save(os.path.join(output_dir, "logo-symbol-white.png"), "PNG")
    print("Generated logo-symbol-white.png")

# 3. logo-full-white.png (Symbol + Text all in white, transparent background, for splash screen)
full_white = Image.new("RGBA", (width, height))
newData = []
for y in range(height):
    for x in range(width):
        r, g, b, a = img.getpixel((x, y))
        # Keep both the symbol (white) and the text (black, r < 75) and color them both white
        if (r > 210 and g > 210 and b > 210) or (r < 75 and g < 75 and b < 75):
            newData.append(white_color)
        else:
            newData.append(transparent)
full_white.putdata(newData)
bbox = full_white.getbbox()
if bbox:
    full_white.crop(bbox).save(os.path.join(output_dir, "logo-full-white.png"), "PNG")
    print("Generated logo-full-white.png")

# 4. logo-full-dark.png (Symbol is purple, text is dark grey/black, for general light-themed use)
full_dark = Image.new("RGBA", (width, height))
newData = []
for y in range(height):
    for x in range(width):
        r, g, b, a = img.getpixel((x, y))
        if r > 210 and g > 210 and b > 210:
            # symbol -> purple
            newData.append(purple_color)
        elif r < 75 and g < 75 and b < 75:
            # text -> black/dark grey
            newData.append((30, 30, 30, 255))
        else:
            newData.append(transparent)
full_dark.putdata(newData)
bbox = full_dark.getbbox()
if bbox:
    full_dark.crop(bbox).save(os.path.join(output_dir, "logo-full-dark.png"), "PNG")
    print("Generated logo-full-dark.png")
