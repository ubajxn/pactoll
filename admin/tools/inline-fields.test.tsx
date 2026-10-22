import assert from "node:assert/strict";
import { test } from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { Button } from "../src/components/ui/button";
import { Input } from "../src/components/ui/input";
import { Textarea } from "../src/components/ui/textarea";

test("inline field variants are quiet at rest and visible on hover and focus", () => {
  for (const markup of [
    renderToStaticMarkup(<Input variant="inline" />),
    renderToStaticMarkup(<Textarea variant="inline" />),
    renderToStaticMarkup(<Button variant="inline">Choose</Button>),
  ]) {
    assert.match(markup, /border-transparent/);
    assert.match(markup, /bg-transparent/);
    assert.match(markup, /hover:bg-muted/);
    assert.match(markup, /focus:border-ring/);
    assert.match(markup, /focus:bg-muted/);
    assert.match(markup, /focus:ring-3/);
  }
});
