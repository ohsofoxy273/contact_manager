$(function() {

  var storage = localStorage['contacts'] || '[]';

  var model = {
    contact: {
      init: function(name, email, phone, tags) {
        this.name = name;
        this.email = email;
        this.phone = phone;
        this.tags = model.tags.init(tags);
        return this;
      },
      validName: function() {
        var criteria = this.name.length > 2;
        return this.checkValidity(criteria, "name");
      },
      validEmail: function() {
        var criteria = this.email.match(/\S+@\S+\.\S+/);
        return this.checkValidity(criteria, "email");
      },
      validTelephone: function() {
        var criteria = this.phone.match(/[1-9-]+/)
        return this.checkValidity(criteria, "telephone");
      },
      isValid: function() {
        var isValidName  = this.validName();
        var isValidEmail = this.validEmail();
        var isValidPhone  = this.validTelephone();
        return isValidName && isValidEmail && isValidPhone;
      },
      checkValidity: function(criteria, input) {
        if (criteria) {
          return true;
        } else {
          view.viewHelpers.inputErrorHandler(input);
          return false;
        }
      }
    },

    contacts: {
      init: function(contactsStorage) {
        this.array = contactsStorage;
        return this;
      },
      add: function(contact) {
        contactsStorage.array.push(contact);
        localStorage.setItem('contacts', JSON.stringify(contactsStorage.array));
      },
      delete: function(index) {
        contactsStorage.array.splice(index, 1);
        localStorage.setItem('contacts', JSON.stringify(contactsStorage.array));
      },
      edit: function(index, contact) {
        contactsStorage.array.splice(index, 1);
        contactsStorage.array.splice(index, 0, contact);
        localStorage.setItem('contacts', JSON.stringify(contactsStorage.array));
      },

      anyContacts: function() {
        if (contactsStorage.array) {
          return contactsStorage.array.length > 0;
        } else {
          return JSON.parse(storage).length > 0;
        }
      },
      matchingSearch: function(regex) {
        var contacts = JSON.parse(localStorage['contacts']);
        return contacts.filter(function(contact) {
          return contact.name.match(regex);
        });
      },
      parseForTemplates: function() {
        arr = this.array || this;
        var contactsObj = {};
        arr.forEach(function(obj, i, contactPerson){
          contactsObj[String(i)] = contactPerson[i];
        });
        return contactsObj;
      },
    },

    tags: {
      init: function(tags) {
        this.tags = tags.split(',').reduce(function(obj, tag, index) {
          tag = tag.trim();
          if (tag !== "") {
            obj[index] = tag;
          }
          return obj;
        }, {});
        return this.tags;
      },
      matchingSearch: function(regex) {
        var contacts = JSON.parse(localStorage['contacts']);
        var contactArray = [];
        contacts.forEach(function(contact) {
          Object.values(contact.tags).forEach(function(tag) {
            if (tag.match(regex)) {
              contactArray.push(contact);
            };
          }); 
        });
        return contactArray;
      },
    }
  };

  var controller = {
    contact: {
      createContact: function(data, index) {
        var newContact = this.helpers.contactFromObject(data)

        if (newContact.isValid()) {
          contactsStorage.add(newContact);
          return true;
        }
        else {
          newContact = null;
          return false;
        }
      },
      updateContact: function(index, data) {
        var newContact = this.helpers.contactFromObject(data)

        if (newContact.isValid()) {
          contactsStorage.edit(index, newContact);
          return true;
        }
        else {
          newContact = null;
          return false;
        }
      },

      helpers: {
        contactFromObject: function(data) {
          var name  = data.name;
          var email = data.email;
          var tele  = data.tele;
          var tags  = data.tags;
          return Object.create(model.contact).init(name, email, tele, tags); 
        },
      },
    },
  };

  var view = {
    init: function() {
      this.viewHelpers.templates.init();
      this.viewHelpers.pageLoad.init();
      this.viewHelpers.eventListeners.init();
    },

    viewHelpers: {    
      pageLoad: {
        init: function() {
          this.hideElements();
          this.buttonFlash();
          this.tagFlash();
        },
        hideElements: function() {
          $('#create_edit_contact').hide();
          $('#no_search_results').hide();
          $('#reset_tag_search').hide();
        },
        buttonFlash: function() {
          $('button').on('mouseenter', function() {
            $(this).addClass('active');
          });
          $('button').on('mouseleave', function() {
            $(this).removeClass('active');
          });
        },
        tagFlash: function() {
          $('.tag').on('mouseenter', function() {
            $(this).addClass('activeTag');
          });
          $('.tag').on('mouseleave', function() {
            $(this).removeClass('activeTag');
          });
        },
      },

      templates: {
        init: function() {
          this.appendFormTemplate();
          this.registerHelpers();
          this.registerPartials();
          this.appendContactsTemplate();
        },
        appendContactsTemplate: function(contacts) {
          var contactsTemplate = Handlebars.compile($('#contactsTemplate').html());
          if (contacts) {
            $('#contacts').html(contactsTemplate({contacts: contactsStorage.parseForTemplates.call(contacts)}));
          } else {
            $('#contacts').html(contactsTemplate({contacts: contactsStorage.parseForTemplates()}));
          }
          $('#no_search_results').hide();
        },
        appendFormTemplate: function(formData) {  
          var formTemplate = Handlebars.compile($('#formTemplate').html());
          var formData = formData || { action: 'Create', button: '<button id="submit">Submit</button>' };
          $('#create_edit_contact').html(formTemplate(formData));
        },
        registerPartials: function() {
          Handlebars.registerPartial('contactList', $('#contactList').html());
        },
        registerHelpers: function() {
          Handlebars.registerHelper('contacts?', model.contacts.anyContacts);
        },
      },

      eventListeners: {
        init: function() {
          this.displayAddContactForm();
          this.submitForm();
          this.deleteContact();
          this.showEditForm();
          this.editContact();
          this.searchForm();
          this.noSearchResults();
          this.tagClick();
          this.resetTagSearch();
          this.showEditForm();
        },

        displayAddContactForm: function() {
          $('main').on('click', '.add', function() {
           view.viewHelpers.hideContactsShowForm();
          });
        },
        submitForm: function() {
          $('#create_edit_contact').on('click', '#submit', function(event) {
            event.preventDefault();
            var formInput = view.viewHelpers.getFormData();

            if (controller.contact.createContact(formInput)) {
              view.viewHelpers.hideFormShowContacts();
            }
          });
        },
        deleteContact: function() {
          $('#contacts').on('click', '.delete', function() {
            var listItems = $(this).closest('ul').find('li');
            var listItem  = $(this).closest('li');
            var index = listItems.index(listItem);
            model.contacts.delete(index);
            view.viewHelpers.templates.appendContactsTemplate();
          });
        },
        showEditForm: function() {
          $('#contacts').on('click', '.edit', function() {
            var list  = this.closest('li');
            var listItems = $(this).closest('ul').find('li');
            var name  = list.querySelector('h3').textContent;
            var phone = list.querySelector('.num').textContent;
            var email = list.querySelector('.email').textContent;
            var tags  = list.querySelector('.tags').textContent.trim().replace(/[\r\n]/g, '').replace(/ \s+/g, ' ').split(/[ ]+/);
            var index = listItems.index(list);

            view.viewHelpers.hideContactsShowForm({action: "Edit", name: name, telephone: phone, email: email, tags: tags, contactIndex: index, button: '<button id="edit">Edit</button>'});
          });
        },
        editContact: function() {
          $('#create_edit_contact').on('click', '#edit', function() {
            event.preventDefault();

            var formInput = view.viewHelpers.getFormData();
            var contactIndex = $('#contactIndex').val();

            if (controller.contact.updateContact(contactIndex, formInput)) {
              view.viewHelpers.hideFormShowContacts();
            }
          });
        },
        searchForm: function() {
          $('#search').on('keyup', function() {
            var regex = new RegExp('\^' + this.value, 'gi');
            var matchingObjects = model.contacts.matchingSearch(regex);
            view.viewHelpers.templates.appendContactsTemplate(matchingObjects || []);
          });
        },
        noSearchResults: function() {
          $('#search').on('keyup', function() {
            var anyResults = $('li').length > 0;
            if (anyResults) {
              $('#no_search_results').hide();
            } else {
              $('#no_search_results').show();
            }
          });
        },
        tagClick: function() { 
          $('#contacts').on('click', '.tag', function() {
            $('#reset_tag_search').show();
            var regex = new RegExp('\^' + $(this).text().trim(), 'gi');
            var matchingObjects = model.tags.matchingSearch(regex);
            view.viewHelpers.templates.appendContactsTemplate(matchingObjects || []);
          });
        },
        resetTagSearch: function() {
          $('#reset_tag_search').on('click', function() {
            view.viewHelpers.templates.appendContactsTemplate();
            $(this).hide();
          }); 
        },

      },
      inputErrorHandler: function(input) {
          var $input   = $(`input[name=${input}`);
          var alertParagraph = $input.parent().next();
          alertParagraph.addClass('active_alert');
      },
      getFormData: function() {
        var  name   = $('input[name="name"]').val(),
             email  = $('input[name="email"]').val(),
             tele   = $('input[name="telephone"]').val(),
             tags   = $('input[name="tags"]').val(),
             formInput = {name: name, email: email, tele: tele, tags: tags};
        return formInput;
      },
      hideFormShowContacts: function() {
        $('#no_contacts').hide(); 
        $('#create_edit_contact').slideUp(600);
        $('#add_and_search').slideDown(600);
        $('form')[0].reset();
        $('#contacts').slideDown(600);
        view.viewHelpers.templates.appendContactsTemplate();
      },
      hideContactsShowForm: function(options) {
        view.viewHelpers.templates.appendFormTemplate(options);
        $('#contacts').slideUp(600);
        $('#add_and_search').slideUp(600);
        $('#create_edit_contact').slideDown(600);
      },
    },
  };

  var contactsStorage = Object.create(model.contacts).init(JSON.parse(storage));
  view.init();

});