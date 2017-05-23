import { browser, element, by, ElementFinder } from 'protractor';
 
describe('Example E2E Test', () => {
 
//   beforeEach(() => {
//     browser.get('');
//   });
 browser.get('');
  it('Pide código de empresa', () => {
      expect(element(by.name('empresa')).isPresent());
  });

  it('hay boton de empresa', () => {
      expect(element(by.name('setEmpresaButton')).isPresent());
  });
   it('escribe el código', () => {
      element(by.name('empresa')).sendKeys('243353');
  }); 
   it('guarda empresa', () => {
      
        element(by.name('setEmpresaButton')).click();

        expect(element(by.css('ion-button')) // Grab the label of the list item
        .getAttribute('innerHTML')) // Get the text content
        .toContain('Login'); // Check if it contains the text "@ionicframework"

        

 
  });

  it('the user can browse to the contact tab and view the ionic twitter handle', () => {
 
    // Click the 'About' tab
    element(by.css('[aria-controls=tabpanel-t0-2]')).click().then(() => { 
 
      // Wait for the page transition
      browser.driver.sleep(1000);
 
      expect(element(by.css('ion-list ion-item ion-label')) // Grab the label of the list item
        .getAttribute('innerHTML')) // Get the text content
        .toContain('@ionicframework'); // Check if it contains the text "@ionicframework"
 
    });
 
  });
 
});