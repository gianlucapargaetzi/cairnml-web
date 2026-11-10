"""A demo run with nested progress bars, to look at the progress UI (list, cards, detail panel, dashboard, compare).

Start several at once, each in its own process, and look at them while they run (about 3 minutes):

    python3 progress-demo.py "resnet outermost" --epochs 8 --batches 80 --delay 1.0   # tqdm, nothing pinned
    python3 progress-demo.py "bert pinned" --pin epochs --epochs 8 --batches 80 --delay 1.0
    python3 progress-demo.py "own iterator" --own --epochs 8 --batches 80 --delay 1.0   # Task.progress
    python3 progress-demo.py "flat steps" --flat --epochs 10 --batches 60 --delay 0.5
    python3 progress-demo.py "no loop at all" --epochs 0 --tail 300                       # idle the whole time

Every run ends with `--tail` seconds of work without a loop: idle again. Delete the project `ui-progress-demo` afterwards.
Stop runs with their PID and `kill -9`: a plain kill can leave a run waiting for the server.
"""
import argparse
import time

from cairnml import Task

parser = argparse.ArgumentParser()
parser.add_argument("name")
parser.add_argument("--pin", default=None)
parser.add_argument("--own", action="store_true", help="use Task.progress instead of tqdm")
parser.add_argument("--flat", action="store_true", help="one bar only")
parser.add_argument("--epochs", type=int, default=6)
parser.add_argument("--batches", type=int, default=60)
parser.add_argument("--delay", type=float, default=0.3)
parser.add_argument("--project", default="ui-progress-demo")
parser.add_argument("--tail", type=float, default=60, help="seconds of work without a loop after the loops (saving the model)")
args = parser.parse_args()

task = Task.init(project_name=args.project, task_name=args.name, progress_bar=args.pin)
if args.own:
    bar = lambda it, **kw: Task.progress(it, label=kw.get("desc"))
else:
    from tqdm import tqdm as bar

if args.flat:
    for _ in bar(range(args.epochs * args.batches), desc="steps"):
        time.sleep(args.delay)
elif args.epochs > 0:
    for _ in bar(range(30), desc="loading"):
        time.sleep(args.delay / 3)
    for epoch in bar(range(args.epochs), desc="epochs"):
        for _ in bar(range(args.batches), desc=f"epoch {epoch + 1}", leave=False):
            time.sleep(args.delay / 4)
        for _ in bar(range(10), desc="validation", leave=False):
            time.sleep(args.delay / 10)
time.sleep(args.tail)  # saving the model, evaluating: no loop, so no progress to report
task.close()
