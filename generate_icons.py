#!/usr/bin/env python3
"""Generate simple PNG icons for ReachAI extension."""

import struct
import zlib
import os

def create_png(size, filename):
    """Create a simple gradient PNG icon."""
    width = height = size
    
    # Create pixel data - purple gradient with star
    pixels = []
    for y in range(height):
        row = []
        for x in range(width):
            # Background gradient from #6366f1 to #8b5cf6
            t = (x + y) / (width + height)
            r = int(99 + (139 - 99) * t)
            g = int(102 + (92 - 102) * t)
            b = int(241 + (246 - 241) * t)
            a = 255
            
            # Draw a simple star shape in white at center
            cx, cy = width / 2, height / 2
            dx, dy = x - cx, y - cy
            dist = (dx**2 + dy**2) ** 0.5
            
            # Simple circle with R logo
            radius = size * 0.45
            if dist <= radius:
                # Inner circle - lighter
                r = min(255, r + 30)
                g = min(255, g + 30)
                b = min(255, b + 30)
            
            # White dot in center area for star
            if dist <= size * 0.15:
                r = g = b = 255
            
            row.extend([r, g, b, a])
        pixels.append(row)
    
    def make_png(width, height, pixels):
        def chunk(name, data):
            c = zlib.crc32(name + data) & 0xffffffff
            return struct.pack('>I', len(data)) + name + data + struct.pack('>I', c)
        
        sig = b'\x89PNG\r\n\x1a\n'
        ihdr_data = struct.pack('>IIBBBBB', width, height, 8, 2, 0, 0, 0)
        ihdr = chunk(b'IHDR', ihdr_data)
        
        raw_data = b''
        for row in pixels:
            raw_data += b'\x00'
            for i in range(0, len(row), 4):
                raw_data += bytes([row[i], row[i+1], row[i+2]])
        
        compressed = zlib.compress(raw_data, 9)
        idat = chunk(b'IDAT', compressed)
        iend = chunk(b'IEND', b'')
        
        return sig + ihdr + idat + iend
    
    png_data = make_png(width, height, pixels)
    with open(filename, 'wb') as f:
        f.write(png_data)
    print(f"Created {filename} ({size}x{size})")

os.makedirs('icons', exist_ok=True)
create_png(16, 'icons/icon16.png')
create_png(48, 'icons/icon48.png')
create_png(128, 'icons/icon128.png')
print("All icons created!")
