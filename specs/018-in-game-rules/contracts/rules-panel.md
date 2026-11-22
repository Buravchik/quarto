# Contract: rules panel

Props:

```ts
{
  open: boolean;
  missMode: "persistent" | "void";
  pieRule: boolean;
  declareHints: boolean;
  copy: { /* i18n keys for classic + session */ };
}
```

Closed: not in accessibility tree as expanded region (or `hidden` / unmounted). Open: `role="region"` labelled by rules title.
