DOMTokenList.prototype.set = function(classString) {
  this.add(...classString.split(" "));
}

HTMLFormElement.prototype.serialize = function() {
  return Array.from(this.elements).reduce((data, element) => {
    const isValidElement = element.name && element.value;
    const isValidValue = (!['checkbox', 'radio'].includes(element.type) || element.checked);
    const isCheckbox = element.type === 'checkbox';
    const isMultiSelect = element.options && element.multiple;
    const getSelectValues = element => Array.from(element.options).reduce((values, option) => {
      return option.selected ? values.concat(option.value) : values;
    }, []);
    
    if (isValidElement && isValidValue) {
      if(isCheckbox) {
        data[element.name] = (data[element.name] || []).concat(element.value);
      } else if (isMultiSelect) {
        data[element.name] = getSelectValues(element);
      } else {
        data[element.name] = element.value;
      }
    }

    return data;
  }, {}) 
}