# Model endpoints

The navigation does not show **Model Endpoints**. The page still exists at `/endpoints/active` and lists the endpoints
that are reported as running. The navigation item is hidden until endpoints can be created from the product.

## How an endpoint is created today

An endpoint is created from code that runs inside a task, with the `HttpRouter` of the CairnML SDK
(`cairnml/router`):

```python
from cairnml import Task

router = Task.current_task().get_http_router()
router.set_local_proxy_parameters(incoming_port=9000)
router.create_local_route(
    source="/",
    target="http://localhost:8000",  # the model server running in the task
    endpoint_telemetry={"model": "MyModel"},
)
router.deploy(wait=True)
```

`endpoint_telemetry` registers the endpoint with the server (`serving.register_container`) and sends status reports
while it runs. These reports are what the Model Endpoints page lists.

## What is not supported

- There is no button, form or CLI command in CairnML that creates, scales or stops an endpoint.
- The proxy runs inside the process of the task. CairnML does not start or manage endpoints as a separate service.
- Endpoints created this way have not been verified end to end on the Model Endpoints page in this release. Check the
  page after creating one before you rely on it.
