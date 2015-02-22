# ember-select-component
A select/multiselect/tags component for EmberJS based on "select2".

## Installation:
* This component requires select2 and ember, so those files must be included in the browser.
* Include the select2 stylesheet.
* Include dist/ember-select-component.js
* Include dist/ember-select-component.css (only if you want the overridden styles)

## Usage:
```
{{select-component
  width='100%', // allows setting the width of the dropdown.
  inputSize='sm', // ('sm' || 'md' || 'lg') *md is default 
  optionValuePath='id', // when provided, values will be strings instead of objects.
  placeholder='Select an option.', // placeholder text
  multiple=false, // (true || false)
  arrowDownIcon= 'fa fa-angle-down', // custom down icon
  arrowUpIcon='fa fa-angle-up', // custom up icon
  disabled=selectDisabled, // (true || false)
  content=selectOptions // options for dropdown (array)
  value=selection // the value to bind to (array or string)
  searchable=true // (true || false)
  minimumResultsForSearch=3 // the minimum # of items req'd to show search box.
}}
```
