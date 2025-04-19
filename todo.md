# TODO

## roadmap

- [x] phase0: prototype/mock
- [x] phase1: drawing features (pen, eraser, layer)
- [ ] phase2: in-app settings (add+edit layers / add+edit pens / edit canvas size + misc)
- [ ] phase3: more ui feature (dialog, toast, internal log), import/export
- [ ] phase4: effects (js implementation)
- [ ] phase5: extra features (optimization, animation, etc)

## pen / tools

- [x] `tool:` pen
- [x] `tool:` eraser
- [ ] `tool:` erase along edge
- [ ] `tool:` spoiler
- [ ] `tool:` bucket(fill)
- [ ] `tool:` shape(circle)
- [ ] `tool:` shape(rect)
- [x] `ui:` size slider

## colors

- [x] `ui:` color picker
- [x] `ui:` color select(standard)

## layers

- [ ] `layer:` dot layer (w/dotMagnifier)
- [ ] `layer:` automate layer (w/dotMagnifier, mode: langton, life)
- [x] `ui:` layer list
- [x] `ui:` sorting
- [x] `ui:` enable/disable
- [x] `ui:` active layer selection
- [ ] `ui:` DSL edit button (-> GUI editor)
- [ ] `data:` compose layers into one image (image-level DSL)

## image_pool

- [x] `ui:` drag
- [x] `ui:` resize
- [ ] `ui:` image DSL edit button

## dsl(rust)

- [ ] `ui:` DSL GUI editor
- [ ] `ui:` DSL CLI editor

> TODO of nodes are in ./todo_dsl.md

## i/o

- [x] `data:` import: image to image_pool
- [x] `data:` import: instant bounce to active layer
- [x] `data:` layer-level export: w/o DSL
- [ ] `data:` layer-level export: with DSL
- [ ] `data:` image-level export: w/o DSL
- [ ] `data:` image-level export: with DSL

## misc

- [x] `misc:` document(dsl)
- [ ] `misc:` document(sledge)
- [ ] `ui:` setting screen
- [ ] `ui:` dialog
- [ ] `ui:` toast
- [ ] `ui:` logging in GUI
- [ ] `ui:` magnifier(mouse-pivot zoomed scope)
- [x] `ui:` companion
