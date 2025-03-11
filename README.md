![Logo](https://casparkroll.de/planer/assets/img/logo.png)

# Modul Planer - Universität Leipzig - Informatik Fakultät
This webpage parses and renders the data from the [planning tool of the faculty](https://www.informatik.uni-leipzig.de/~stundenplan/modul.html) in a neat timetable view.  
It also gives the option to filter the data by useful filter options e.g. course or type of event.

## Features
- Display of lessons in Timetable view with view as week, day or list with FullCalendar.io
- Filtering of lessons by state, type of event, module, course and teaching person
- Progressive Web App
- Offline Usage and Caching
- Responsive design
- Complete dark mode

## Requirements
- Apache Web Server
- PHP Processor for Apache
- cURL Module for Apache

## Installation
Install Apache Web Server (or any oher Web Server) with PHP support and copy contents to the html directory or the desired location.  
Change the proxy url in [js/js.js](https://github.com/natureFrameworkManager/planer/blob/main/js/js.js) in the function `getHTML` to your own URL on your Server of the [getHtml.php](https://github.com/natureFrameworkManager/planer/blob/main/getHtml.php) file or **leave the original URL**.

## Feature ideas
- [x] Parse Data
- [x] Filtering (state, type, module, course, person)
- [x] Responsive design
- [x] PWA
- [x] Offline Usage
- [ ] Deselect not possible selections in filter (don't uncheck human-selected)
- [ ] Generate final time table from selectable events
  - [ ] Hide selected events 

## Tech Stack
**Client:** HTML, TailwindCSS, Plain JavaScript, Material Icons

**Server:** PHP, cURL

## License
[Open Software License 3.0](https://choosealicense.com/licenses/osl-3.0/)

## Acknowledgements
 - [FullCalendar.io](https://fullcalendar.io/)
 - [TailwindCss](https://tailwindcss.com/)
 - [PHP](https://php.net)
 - [Composer](https://github.com/composer/composer)
 - [README Editor](https://readme.so/de)
 - [Choose an open source license](https://choosealicense.com/)
