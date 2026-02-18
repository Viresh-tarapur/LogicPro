from PIL import Image, ImageDraw, ImageFont
import os

def create_icon(size, path):
    img = Image.new('RGB', (size, size), color = (59, 130, 246)) # Blue color
    d = ImageDraw.Draw(img)
    # Draw a simple "AI" text or shape
    d.text((size//4, size//4), "AI", fill=(255, 255, 255))
    img.save(path)

if not os.path.exists("v:/project/python extensions/extension/icons"):
    os.makedirs("v:/project/python extensions/extension/icons")

create_icon(16, "v:/project/python extensions/extension/icons/icon16.png")
create_icon(48, "v:/project/python extensions/extension/icons/icon48.png")
create_icon(128, "v:/project/python extensions/extension/icons/icon128.png")
print("Icons created.")
