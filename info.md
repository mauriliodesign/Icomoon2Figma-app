# IcoMoon Icon Converter for Figma String Variables

This is a simple **Vanilla JavaScript** app built with pure HTML, designed to help designers and developers convert icons exported from [IcoMoon](https://icomoon.io) into Unicode glyphs that can be used as **string variables in Figma**.

## 🧩 Features

- Upload a `selection.json` file exported from IcoMoon.
- Automatically reads the icons from the file.
- Converts the hexadecimal code into the corresponding Unicode character.
- Displays a table with:
  - Icon name
  - Unicode code (`\uXXXX`)
  - Visual glyph (e.g., ``)
  - Copy button for easy character copying
- Compatible with creating *String Variables* in Figma for use in design systems.

## 📁 File Structure

- `index.html`: Main HTML + JS file with all the app logic.
- No external dependencies required (no build step, no Node, no frameworks).
- IcoMoon font (woff/ttf) can be included in Figma or a separate design page if visual rendering is desired in the browser.

## 💡 How to Use

1. Export your icons from IcoMoon using the `Download` option (make sure `selection.json` is included).
2. Open `index.html` in your browser.
3. Upload the `selection.json` file.
4. A table will be displayed with all necessary icon data.
5. Use the glyphs directly in Figma as string variables linked to the custom font.

## 🧠 Next Steps (to complete in Cursor AI)

- Add automatic export to JSON in [Tokens Studio](https://docs.tokens.studio/) format for direct Figma import.
- Style the table with dark theme and responsive layout.
- Allow data export as `.csv` or `.json`.
- Add live preview using the actual IcoMoon font (include `.woff` in the project).

## 🛠️ Technologies Used

- HTML5
- JavaScript (Vanilla)
- FileReader API
- Clipboard API

---