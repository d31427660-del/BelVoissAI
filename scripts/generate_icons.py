from PIL import Image, ImageDraw

def create_voxi_icon(size=512, corner_ratio=0.28, padding=0.26):
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # Outer rounded rectangle (Obsidian)
    r = int(size * corner_ratio)
    # Background: dark obsidian #0A0A0C
    draw.rounded_rectangle([(0, 0), (size - 1, size - 1)], radius=r, fill=(10, 10, 12, 255))
    
    # Subtle inner border for liquid/specular highlight
    draw.rounded_rectangle([(1, 1), (size - 2, size - 2)], radius=r - 1, outline=(255, 255, 255, 36), width=max(1, size // 128))
    
    # Two vertical acoustic bars (II)
    # Width of each bar
    bar_w = int(size * 0.14)
    # Gap between bars
    gap = int(size * 0.065)
    # Total width of both bars + gap
    total_w = bar_w * 2 + gap
    
    start_x = (size - total_w) // 2
    bar1_x = start_x
    bar2_x = start_x + bar_w + gap
    
    # Height of bars
    bar_h = int(size * 0.46)
    start_y = (size - bar_h) // 2
    
    bar_radius = bar_w // 2
    
    # Draw bars in pure white
    draw.rounded_rectangle([(bar1_x, start_y), (bar1_x + bar_w, start_y + bar_h)], radius=bar_radius, fill=(255, 255, 255, 255))
    draw.rounded_rectangle([(bar2_x, start_y), (bar2_x + bar_w, start_y + bar_h)], radius=bar_radius, fill=(255, 255, 255, 255))
    
    return img

# Generate 512x512 Social Avatar
avatar_512 = create_voxi_icon(512)
avatar_512.save("public/voxi-avatar-social.png", "PNG")

# Generate 192x192 Favicon PNG
favicon_192 = create_voxi_icon(192)
favicon_192.save("public/voxi-favicon.png", "PNG")

# Generate 32x32 Favicon PNG
favicon_32 = create_voxi_icon(32, corner_ratio=0.25)
favicon_32.save("public/favicon-32x32.png", "PNG")

print("Generated PNG assets successfully!")
