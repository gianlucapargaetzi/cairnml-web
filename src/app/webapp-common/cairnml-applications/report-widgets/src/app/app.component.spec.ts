import {TestBed} from '@angular/core/testing';
import {provideHttpClient} from '@angular/common/http';
import {MockStore, provideMockStore} from '@ngrx/store/testing';
import {AppComponent} from './app.component';
import {appFeature, initialState, State} from './app.reducer';

// The plot widget of a report. A task without plot data comes back from the server as an empty plot response, and the
// widget has to show nothing for it instead of throwing. The throw happens inside a store subscription, which rxjs
// reports asynchronously (setTimeout), so the clock is mocked and flush() runs the timers: the error the subscription
// reported is thrown out of it. (The test bundle has no zone.js/testing, so there is no fakeAsync.)
describe('report widget: plot', () => {
  let store: MockStore<{ [appFeature.name]: State }>;
  let originalUrl: string;
  let sourceTasks: string[];
  let messageListeners: EventListenerOrEventListenerObject[];

  const flush = () => jasmine.clock().tick(1000);

  const plotState = (): State => ({
    ...initialState,
    plotlyReady: true,
    taskData: {sourceProject: 'project-1', sourceTasks, appId: 'app-1'}
  });

  const onePlot = {
    metric: {
      variant: {
        'task-1': {
          1: {
            name: 'task one',
            plots: [{
              metric: 'metric',
              variant: 'variant',
              iter: 1,
              plot_str: JSON.stringify({data: [{type: 'scatter', x: [1, 2], y: [3, 4]}], layout: {title: 'metric'}})
            }]
          }
        }
      }
    }
  };

  // The widget reads its type, objects and series from the query string of the page it runs in.
  const openWidget = (query: string, tasks: string[]) => {
    sourceTasks = tasks;
    window.history.replaceState(null, '', `${window.location.pathname}?${query}`);
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideMockStore({initialState: {[appFeature.name]: plotState()}})]
    });
    TestBed.overrideComponent(AppComponent, {set: {template: '', imports: []}});
    store = TestBed.inject(MockStore);
    return TestBed.createComponent(AppComponent).componentInstance;
  };

  const respondWith = (plotData: unknown) => {
    store.setState({[appFeature.name]: {...plotState(), plotData} as State});
  };

  beforeEach(() => {
    jasmine.clock().install();
    originalUrl = window.location.href;
    messageListeners = [];
    // ngOnInit registers a permanent 'message' listener on the window; collect it to remove it again, so it does not
    // leak into the specs that run after this one.
    const addEventListener = window.addEventListener.bind(window);
    spyOn(window, 'addEventListener').and.callFake(((type: string, listener: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions) => {
      if (type === 'message') {
        messageListeners.push(listener);
      }
      addEventListener(type, listener, options);
    }) as typeof window.addEventListener);
  });

  afterEach(() => {
    jasmine.clock().uninstall();
    messageListeners.forEach(listener => window.removeEventListener('message', listener));
    window.history.replaceState(null, '', originalUrl);
  });

  it('a plot widget whose task has no plot data does not throw and shows nothing', () => {
    const widget = openWidget('type=plot&objects=task-1', ['task-1']);
    widget.ngOnInit();

    respondWith({});

    expect(() => flush()).not.toThrow();
    expect(widget.plotData).toBeUndefined();
    expect(widget.plotLoaded).toBeTrue();
  });

  it('the compare branch does not throw on no plot data', () => {
    const widget = openWidget('type=plot&objects=task-1,task-2&series=task-1', ['task-1', 'task-2']);
    widget.ngOnInit();
    // Two source tasks and a series: the widget takes the compare branch (the single branch would also end without a plot).
    expect(widget['tasksData']().sourceTasks.length).toBe(2);

    respondWith({});

    expect(() => flush()).not.toThrow();
    expect(widget.plotData).toBeUndefined();
    expect(widget.plotLoaded).toBeTrue();
  });

  it('a plot widget whose task has a plot shows that plot', () => {
    const widget = openWidget('type=plot&objects=task-1', ['task-1']);
    widget.ngOnInit();

    respondWith(onePlot);

    expect(() => flush()).not.toThrow();
    expect(widget.plotLoaded).toBeTrue();
    expect(widget.plotData.layout).toEqual(jasmine.objectContaining({title: 'metric'}));
    expect(widget.plotData.data.length).toBe(1);
    expect(widget.plotData.data[0].type).toBe('scatter');
    expect(widget.plotData.data[0].y).toEqual([3, 4]);
  });
});
