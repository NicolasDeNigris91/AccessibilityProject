# What's next

A short list of things I still want to add when I get the time.

- PDF export of the audit report (currently a disabled placeholder in the UI).
- BullMQ Bull-Board mounted at `/admin/queues` behind basic auth, so I can
  see the queue from a browser.
- Prometheus metrics on `/metrics` and a Grafana dashboard for queue depth and
  audit duration.
- A "watch this URL" mode that re-audits on a schedule and emails a diff when
  the score drops.
- Multi-page crawl. Today the worker audits the single URL it is given.
