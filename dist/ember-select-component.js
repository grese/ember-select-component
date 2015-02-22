(function(){
    'use strict';

    var Select2 = Ember.Component.extend({
        init: function(){
            Ember.assert('select2 has to exist on Ember.$.fn.select2', Ember.$.fn.select2);
            this._super();
        },
        tagName: 'input',
        classNames: ['select-component', 'multiselect'],
        classNameBindings: ['_inputSize'],
        attributeBindings: ['_style:style', 'disabled'],

        // Computed property to turn style-related properties to css for style attribute.
        _style: function(){
            var css = {
                    width: this.get('width')
                },
                style = '';

            for(var prop in css){
                if(css[prop] !== null){
                    style += (prop + ':' + css[prop] + '; ');
                }
            }
            return style;
        }.property('width'),

        //Bindings that may be overwritten in the template
        width: '100%',
        inputSize: null,
        optionValuePath: null,
        placeholder: null,
        multiple: false,
        arrowDownIcon: 'fa fa-angle-down',
        arrowUpIcon: 'fa fa-angle-up',
        searchable: true,
        minimumResultsForSearch: 3,


        //Provides bootstrap input-size functionality.
        _inputSize: function(){
            switch(this.get('inputSize')){
                // Small input:
                case 'small':
                case 'sm':
                    return 'input-sm';
                // Large input:
                case 'large':
                case 'lg':
                    return 'input-lg';
                // Medium input (default):
                default:
                    return '';
            }
        }.property('inputSize'),

        didInsertElement: function() {
            var self = this,
                options = {},
                get = Ember.get;

            // setup
            options.placeholder = this.get('placeholder');
            options.multiple = this.get('multiple');
            options.minimumResultsForSearch = this.get('searchable') ? this.get('minimumResultsForSearch') : -1;

            // Function to format the result:
            options.formatResult = function(item) {
                if (!item) {
                    return;
                }
                var id = get(item, 'id'),
                    label = get(item, 'label'),
                    description = get(item, 'description'),
                    output = Ember.Handlebars.Utils.escapeExpression(label);
                if (id && description) {
                    output += ' <span class=\'text-muted\'>' +
                    Ember.Handlebars.Utils.escapeExpression(description) + '</span>';
                }

                return output;
            };

            // formats the selections...
            options.formatSelection = function(item) {
                if (!item) {
                    return;
                }
                var label = get(item, 'label');
                return Ember.Handlebars.Utils.escapeExpression(label);
            };

            // Filters the list of search terms to be displayed when user enters something in the search box.
            options.query = function(query) {
                var select2 = this;

                var filteredContent = self.get('content').reduce(function(results, item) {
                    // items may contain children, so filter them, too
                    var filteredChildren = [];
                    if (item.children) {
                        filteredChildren = item.children.reduce(function(children, child) {
                            if (select2.matcher(query.term, get(child, 'label'))) {
                                children.push(child);
                            }
                            return children;
                        }, []);
                    }
                    // apply the regular matcher
                    if (select2.matcher(query.term, get(item, 'label'))) {
                        // keep this item either if itself matches
                        results.push(item);
                    } else if (filteredChildren.length) {
                        // or it has children that matched the term
                        var result = $.extend({}, item, {
                            children: filteredChildren
                        });
                        results.push(result);
                    }
                    return results;
                }, []);
                query.callback({
                    results: filteredContent
                });
            };

            // When 'optionValuePath' property is set, this method will be used to map the 'value' property to the object in
            // 'content' that matches the value. It will either use an object, or array of objects (depending on multiple).
            options.initSelection = function(element, callback) {
                var value = element.val(),
                    content = self.get('content'),
                    multiple = self.get('multiple'),
                    optionValuePath = self.get('optionValuePath');

                if (!value || !value.length) {
                    return callback([]);
                }

                // This method should never be used without 'optionValuePath', so make sure an error is logged.
                Ember.assert('select2#initSelection has been called without an \'' +
                'optionValuePath\' set.', optionValuePath);

                var values = value.split(','),
                    filteredContent = [],
                    contentLength = content.length,
                    unmatchedValues = values.length,
                    matchIndex, item, child;

                // Loop through objects, and check if its 'optionValuePath' is in the selected values array.
                for (var i = 0; i < contentLength; i++) {
                    item = content[i];
                    matchIndex = -1;

                    if (item.children && item.children.length) {
                        // take care of either nested data...
                        for (var c = 0; c < item.children.length; c++) {
                            child = item.children[c];
                            matchIndex = values.indexOf('' + get(child, optionValuePath));
                            if (matchIndex !== -1) {
                                filteredContent[matchIndex] = child;
                                unmatchedValues--;
                            }
                            // break loop if all values are found
                            if (unmatchedValues === 0) {
                                break;
                            }
                        }
                    } else {
                        // ...or flat data structure: try to match simple item
                        matchIndex = values.indexOf('' + get(item, optionValuePath));
                        if (matchIndex !== -1) {
                            filteredContent[matchIndex] = item;
                            unmatchedValues--;
                        }
                        // break loop if all values are found
                        if (unmatchedValues === 0) {
                            break;
                        }
                    }
                }

                if (unmatchedValues === 0) {
                    self._select.select2('readonly', false);
                } else {
                    // disable the select2 element if there are keys left in the values array that were not matched...
                    self._select.select2('readonly', true);
                    Ember.warn('select2#initSelection was not able to map each \'' +
                    optionValuePath + '\' to an object from \'content\'. The remaining ' +
                    'keys are: ' + values + '. The input will be disabled until a) the ' +
                    'desired objects is added to the \'content\' array or b) the ' +
                    '\'value\' is changed.', !values.length);
                }

                if (multiple) {
                    // return all matched objects
                    return callback(filteredContent);
                } else {
                    // only care about the first match in single selection mode
                    return callback(filteredContent.get('firstObject'));
                }
            };

            this._select = this.$().select2(options);

            this._select.on('change', function() {
                // The selection changed, so let's update the input's value.
                var data = self._select.select2('data');
                self.selectionChanged(data);
            });

            // icon replacement:
            if(this.get('arrowUpIcon') && this.get('arrowDownIcon')){
                this._replaceToggleIcon();
            }
            this._select.on('select2-open', function(){
                self._updateToggleIcon('up');
            });

            this._select.on('select2-close', function(){
                self._updateToggleIcon('down');
            });

            // trigger initial data sync to set select2 to the external 'value'
            this.valueChanged();
        },

        // Unbinds events, and destroys select2.
        willDestroyElement: function() {
            this._select.off('change');
            this._select.select2('destroy');
        },

        // selectionChanged:
        // Responds to changes when the select2 selection changes...
        selectionChanged: function(data) {
            var value,
                multiple = this.get('multiple'),
                optionValuePath = this.get('optionValuePath'),
                get = Ember.get;

            // When 'optionValuePath' is set, get the value in the path, and use that as the value instead of the
            // complete object.
            if (optionValuePath) {
                if (multiple) {
                    // data is an array, so use getEach
                    value = data.getEach(optionValuePath);
                } else {
                    // treat data as a single object
                    value = get(data, optionValuePath);
                }
            } else {
                value = data;
            }
            this.set('value', value);
        },

        // valueChanged: (observes value property)
        // Responds to external value changes.
        valueChanged: function(){
            var value = this.get('value'),
                optionValuePath = this.get('optionValuePath');

            if (optionValuePath) {
                // when there is a optionValuePath, the external value is a primitive value so use 'val'
                this._select.select2('val', value);
            } else {
                // otherwise set the full object via 'data'
                this._select.select2('data', value);
            }
        }.observes('value'),

        // contentChanged: (observes each item in content array)
        // Responds to changes on the content array, and triggers an update to select2... (for things like lazy loading)
        contentChanged: function(){
            this.valueChanged();
        }.observes('content.@each'),

        // Some additional methods for customization (things like icon replacement)...
        $toggleIcon: null,
        _replaceToggleIcon: function(){
            // Removing the default select2 dropdown icon and replacing it with a custom icon.
            var $selectContainer  = this._select.select2('container'),
                $arrowContainer = $selectContainer.find('.select2-arrow'),
                $arrow = $arrowContainer.find('b');
            $arrow.remove();
            $arrowContainer.append("<span class='dropdown-toggle-icon " + this.get('arrowDownIcon') + "'></span>");
            this.set('$toggleIcon', $arrowContainer.find('.dropdown-toggle-icon').eq(0));
        },
        _updateToggleIcon: function(direction){
            // direction should be either 'up' or 'down'.
            var upClass = this.get('arrowUpIcon'),
                downClass = this.get('arrowDownIcon'),
                $iconEl = this.get('$toggleIcon');
            if(direction === 'up'){
                $iconEl.removeClass(downClass);
                $iconEl.addClass(upClass);
            }else{
                $iconEl.removeClass(upClass);
                $iconEl.addClass(downClass);
            }
        }

    });

    Ember.SelectComponent = Select2;
    Ember.Handlebars.helper('select-component', Ember.SelectComponent);
}(this));
