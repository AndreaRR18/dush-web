// The page's entry point: wires the interactive parts after the HTML has loaded.

import { setUpCopyButtons } from "./copy.ts";
import { setUpHeader } from "./header.ts";
import { setUpReveal } from "./reveal.ts";

setUpCopyButtons(document);
setUpHeader(document);
setUpReveal(document);
