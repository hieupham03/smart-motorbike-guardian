"""Read ESP32 logs without sending commands. Store raw evidence locally, not in Git."""
from pathlib import Path
import argparse, concurrent.futures, json, re, sys, time

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT/'.local/tools'))
try:
    import serial
except ImportError:
    raise SystemExit('Install pyserial first: python -m pip install pyserial')


def capture(port, seconds, folder):
    connection = serial.Serial(port=None, baudrate=115200, timeout=0.3)
    connection.dtr = False
    connection.rts = False
    connection.port = port
    lines = []
    try:
        connection.open()
        deadline = time.monotonic()+seconds
        with (folder/(port+'.log')).open('w', encoding='utf-8') as output:
            while time.monotonic()<deadline:
                line = connection.readline().decode('utf-8', errors='replace').strip()
                if not line: continue
                # Do not print raw GPS positions, Wi-Fi details or credentials.
                output.write(line+'\n')
                lines.append(line)
    except serial.SerialException as error:
        return {'port':port,'error':str(error),'lines':0}
    finally:
        connection.close()
    text='\n'.join(lines)
    states=re.findall(r'state=([A-Z_]+)',text)
    speeds=re.findall(r'speed=([0-9.]+)',text)
    return {'port':port,'lines':len(lines),'state':states[-1] if states else None,
            'last_speed_kmh':float(speeds[-1]) if speeds else None,
            'fresh_uart_seen':'fresh=1' in text,'wheel_session_seen':'[WHEEL SESSION]' in text,
            'gps_fix_seen':'[GPS FIX]' in text,'gps_no_fix_seen':'[GPS NO_FIX]' in text,
            'imu_real_seen':'REAL (I2C)' in text,'uart_disconnected_seen':'DISCONNECTED' in text,
            'firmware_versions':sorted(set(re.findall(r'\[FIRMWARE\][^\n]+',text)))}


if __name__=='__main__':
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument('--ports',nargs='+',required=True)
    p.add_argument('--seconds',type=int,default=15)
    p.add_argument('--out',default='.local/evidence/serial')
    args=p.parse_args()
    if not 1<=args.seconds<=3600: p.error('--seconds must be between 1 and 3600')
    folder=(ROOT/args.out).resolve()
    if not folder.is_relative_to(ROOT/'.local'): p.error('Raw serial logs must stay under .local/')
    folder.mkdir(parents=True,exist_ok=True)
    with concurrent.futures.ThreadPoolExecutor(max_workers=len(args.ports)) as pool:
        results=list(pool.map(lambda port:capture(port,args.seconds,folder),args.ports))
    (folder/'summary.json').write_text(json.dumps(results,indent=2),encoding='utf-8')
    print(json.dumps(results,indent=2))
    raise SystemExit(1 if any(item.get('error') or not item['lines'] for item in results) else 0)
