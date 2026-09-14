[ ] It appears that chevron disappeared for the complex actions (for example stroke style, text format) in Grouped and Inline behaviors, while preserved (as expected) in Flat.
[ ] do not show formatting toolbar while dragging object. Allow to drag object without causing them to be selected - with this we will avoid the annoying toolbar showing on regular operations with the diagram.
[ ] "keep details ope"n does not seem to be working for the flat mode and text controls
[ ] make sure the color control load custom colors from the existing diagram on open (separate for fill, stroke and fonts)
[ ] let's add one more style - Octopart. Do deep analysis of the octopart.com and select colors optimal for the system design diagram. You can optimize color to have a best of all color schemas, just keep it recognizeable.
[ ] text object lost the full menu mode in flat mode. Let's make sure text object also has fill and border attributes.
[ ] lets' make trasperent color circles for Stroke looks as no-line, rather than just transparent - could be an crossed circle with transparent background or similar easy to understand visualization.
[ ] Let's  add a right mouse click menu, with typical operations for diagram drawing tools. Do not implement the actions themselves yet, we just testing the visual appearance. Before realizing it in code deduct the required and expected actions and show them for review.
[ ] adjust size of the "technical" button, to make them tad smaller/narrower (similar how Google does). Examples of such button - plus and minus for text size, additional actions  at the end of the toolbar. I want to communicate to a user that those are not independent buttons as rest and more of the system elements/sub elements. In addition it will allow to save a little bit of the horizontal space.
[ ] 
[ ] separate the key settings from advanced. Advanced is a separate detailed mode of the panel, where all vertical space dedicated to settings. Each setting has and explanatory picture showing what it actually changes. Make width of the Lab panel adjustable to accomodate reacher context. Key setting - Merge color and style, COmpact Text alignement, Font size stepper, Sho more actions, toolbar shortcuts
[ ] move native editor actions, such as command palette and shortucts to the burger menu, similar to excalidraw. Top space we will use for the lab controls.
[ ] optimize the color palette - pic a good set of modern colors suitable for the diagram creation. Leave a few "system" colors that people expect to have - for example regular red color




Editor Experiements
[ ] make placement of the objects an interactive behavior - clicking the button does not place object right away, but initiates and interactive drawing behavior specialized for ech object type. Leave drawing of the connection live aside for now - it is complex one, i'll do it as separate task.
[ ] let's implement the interactive behavior for drawing connection lines. Optimize it fro the simple system diagrams, when key goal is to express connectin between blocks.
[ ] adjust the hardware component to be closer to what we have in current ESD
[ ] introduce ports