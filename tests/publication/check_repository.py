"""Check the published source layout and local Markdown links. No third-party packages."""
from pathlib import Path
import argparse, re, subprocess, sys
from urllib.parse import unquote

ROOT = Path(__file__).resolve().parents[2]
REQUIRED = {"README.md", ".env.example", "firmware", "backend", "frontend", "database", "deployment", "hardware", "tests", "docs"}
TOP = REQUIRED | {".gitignore", ".gitattributes", ".github"}
FORBIDDEN_PARTS = {"node_modules", "dist", "target", ".local", ".agents", ".expo", ".vite", "__pycache__"}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--tracked', action='store_true', help='Check only tracked files, as in a clean checkout')
    args = parser.parse_args()
    command = ['git', 'ls-files', '-z'] if args.tracked else ['git', 'ls-files', '--cached', '--others', '--exclude-standard', '-z']
    names = sorted(set(subprocess.check_output(command, cwd=ROOT).decode('utf-8').split('\0')) - {''})
    files = [name for name in names if (ROOT/name).is_file()]
    errors = []
    roots = {name.split('/')[0] for name in files}
    for name in sorted(REQUIRED - roots): errors.append('Missing required entry: '+name)
    for name in files:
        path = Path(name)
        if path.parts[0] not in TOP: errors.append('Unexpected top-level release entry: '+name)
        if FORBIDDEN_PARTS.intersection(path.parts): errors.append('Generated/private path: '+name)
        if (path.name.startswith('.env') and path.name != '.env.example') or path.name in {'network_config.h','google-services.json','GoogleService-Info.plist','AGENTS.md'}:
            errors.append('Private configuration/instructions: '+name)
        if path.suffix.lower() in {'.log','.tmp','.db','.sqlite','.pem','.key','.jks','.keystore','.p12','.p8','.apk','.aab','.class','.jar'} or path.name.startswith('~$') or '.bak_' in path.name or path.suffix=='.lck':
            errors.append('Runtime/binary secret or build artifact: '+name)
        if path.name == '.gitkeep': errors.append('Redundant empty-directory marker: '+name)
        if (ROOT/name).stat().st_size > 40*1024*1024: errors.append('Oversized release file: '+name)
        if path.name=='.env.example':
            for i,line in enumerate((ROOT/name).read_text('utf-8-sig').splitlines(),1):
                if not line or line.lstrip().startswith('#') or '=' not in line: continue
                key,value=line.split('=',1)
                if re.search(r'(PASSWORD|SECRET|TOKEN|API_KEY|GOOGLE_SERVICES_JSON)$',key) and value.strip():
                    errors.append(f'Non-empty secret placeholder: {name}:{i} ({key})')
        if path.suffix.lower() != '.md': continue
        text=(ROOT/name).read_text('utf-8-sig')
        text=re.sub(r'```[^\n]*\n.*?```','',text,flags=re.S)
        for match in re.finditer(r'!?\[[^\]]*\]\((<[^>]+>|[^)\n]+)\)',text):
            target=match.group(1).strip()
            if target.startswith('<'): target=target[1:-1]
            else: target=re.split(r'\s+["\']',target,maxsplit=1)[0]
            if not target or target.startswith(('#','http:','https:','mailto:','data:')): continue
            target=unquote(target.split('#',1)[0].split('?',1)[0])
            resolved=(ROOT/name).parent.joinpath(target).resolve()
            line=text.count('\n',0,match.start())+1
            if not resolved.is_relative_to(ROOT) or not resolved.exists(): errors.append(f'Broken local link: {name}:{line} -> {target}')
            elif resolved.is_file() and resolved.relative_to(ROOT).as_posix() not in files:
                errors.append(f'Link to unpublished file: {name}:{line} -> {target}')
    if errors:
        print('\n'.join(errors))
        print(f'FAIL publication: {len(errors)} issues across {len(files)} files')
        return 1
    print(f'PASS publication: {len(files)} files; required layout, private-file exclusions, env placeholders and Markdown links')
    return 0


if __name__=='__main__': sys.exit(main())
