import os
import glob

def replace_in_files(directory):
    jsx_files = glob.glob(f"{directory}/**/*.jsx", recursive=True)
    
    replacements = {
        "text-gray-100": "text-slate-900",
        "text-gray-300": "text-slate-700",
        "text-gray-400": "text-slate-500",
        "bg-cardHover": "bg-slate-50",
        "bg-card": "bg-white",
        "bg-border/50": "bg-slate-200",
        "border-border": "border-slate-200"
    }
    
    for filepath in jsx_files:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
            
        modified = content
        for old, new in replacements.items():
            modified = modified.replace(old, new)
            
        if modified != content:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(modified)
            print(f"Updated {filepath}")

replace_in_files(r"e:\ALL PROJECTS\MIRAGE\RAG_PROJECT\MIRAGE\frontend\src")
