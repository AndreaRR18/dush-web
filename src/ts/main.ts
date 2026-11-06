// The page's entry point: wires the interactive parts after the HTML has loaded.

import { setUpCopyButtons } from "./copy.ts";
import { setUpHeader } from "./header.ts";
import { setUpLanguageMenu } from "./lang.ts";
import { setUpReveal } from "./reveal.ts";

setUpCopyButtons(document);
setUpHeader(document);
setUpLanguageMenu(document);
setUpReveal(document);
