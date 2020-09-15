import React from 'react';
import { StyleSheet, Text, View, Switch, TouchableOpacity, Alert} from 'react-native';
import { Icon } from 'react-native-elements'
import Voice from '@react-native-community/voice';
import { Neomorph } from 'react-native-neomorph-shadows';
import LinearGradient from 'react-native-linear-gradient';
import evaluate from './evaluation';
import Modal from 'react-native-modal';
import SplashScreen from 'react-native-splash-screen';
import AsyncStorage from '@react-native-community/async-storage';

class App extends React.Component {
  constructor() {
    super()
    this.recording = null
    Voice.onSpeechResults = this.onSpeechResults.bind(this);

    this.state = {
      displayString: '',
      darkTheme: false,
      language: 'ru-RU',
      recordingPermission: false,
      results: [],
      menuHidden: true
    }
  


  }
  retrieveThemeFromStorage = async () => {
    try {
      const theme = await AsyncStorage.getItem('smartCalcThemeSetting')
      if (theme==='true') {
        this.setState({darkTheme: true})
      } else if (theme==='false') {
        this.setState({darkTheme:false})
      }
    } catch (err) {
      console.log('Error retrieving data', err)
    }
  }
  retrieveLanguageFromStorage = async () => {
    try {
      const language = await AsyncStorage.getItem('smartCalcLanguageSetting')
      if (language) {
        this.setState({language: language})
      } 
    } catch (err) {
      console.log('Error retrieving data', err)
    }
  }

  componentDidMount() {
    this.retrieveLanguageFromStorage();
    this.retrieveThemeFromStorage();
    setTimeout(() => {
      SplashScreen.hide();  
    }, 100);
    
  }
 
  shouldComponentUpdate(nextProps, nextState) {
    if (this.state===nextState) {
    return false }
    return true
  }

  componentWillUnmount() {
    Voice.destroy().then(Voice.removeAllListeners);
  }

  onChangeTheme = () => {
      this.storeData('smartCalcThemeSetting',`${!this.state.darkTheme}`)
      this.setState({darkTheme: !this.state.darkTheme})  
      
  }



  onSpeechResults(e) {
    if (this.state.results.length===0){
    let str = e.value[0].replace(/ Х|X|x|х|умножить на/g,'*')
    str = str.replace(/,|,/g,'.')
    if (this.state.language==='ru-RU'){
      str = str.replace(/корень из|квадратный корень из|корень от|квадратный корень от/g,'\u221A')
      str = str.replace(/в квадрате|во второй степени|в второй степени/g,'\u00B2')
      str = str.replace(/скобка открывается/g,'(')
      str = str.replace(/скобка закрывается/g,')')
      str = str.replace(/плюс/g,'+')
      str = str.replace(/минус/g,'-')
      str = str.replace(/два/g,'2')

    } else {
      str = str.replace(/square root from|squared root of|squared root from|root of|root from|square root of/g,'\u221A')
      str = str.replace(/squared|to the power of two|\^ 2/g,'\u00B2')
      str = str.replace(/opening bracket|open bracket/g,'(')
      str = str.replace(/closing bracket|close bracket/g,')')
    }
    str = str.replace(/of|от/g,'*')   
    if (str.match(/равно|equal|=/)) {
        str = str.replace(/равно|equal|equals|=/g,'')
        this.setState({
          results:e.value,
          displayString: this.state.displayString+str
        },() => this.calculateExpression())
    } else{
    this.setState({
      results: e.value,
      displayString: this.state.displayString+str

    });
  }
  }

  }

  async startRecognition(e) {
    this.setState({
      results:[]
    })
    try {
      await Voice.start(`${this.state.language}`);
    } catch (e) {
      Alert.alert(language==='en-US'?'Recognition Error':'Ошибка распознавания', language==='en-US'?'Your device does not support this language':'Ваше устроиство не поддерживает распознавание речи на этом языке!')
    }
  }

  clearDisplay = () => {
    this.setState({displayString: ''})
  }

  clearLastSymbol = () => {
    this.setState({displayString: this.state.displayString.slice(0,-1)})
  }

  addSymbol = (symbol) => {
    const {displayString} = this.state
    if (displayString.length>0){
      if (symbol.match(/\+|\*|\/|-|%|\.|\)/) && displayString[displayString.length-1].match(/\+|\*|\/|-|\u221A|%|\.|\(/)) {

        if (symbol==='-' && displayString[displayString.length-1]==='(') {
          this.setState({displayString: displayString+symbol})
        } 
        if (symbol.match(/\+|\*|-|\/|\)/) && displayString[displayString.length-1]==='%'){
          this.setState({displayString: displayString+symbol})
        }
      } else if (symbol.match(/\u221A/)&& displayString[displayString.length-1].match(/\u221A|\./)){
        null
      } else if (symbol.match(/\(/)&&displayString[displayString.length-1].match(/[0-9]|\)/)){
        null
      } else if (symbol.match(/[0-9]/)&&displayString[displayString.length-1].match(/\)|\u00B2/)) {
        null
      } else if (symbol.match(/\u00B2/) && displayString[displayString.length-1].match(/[0-9]|\)/)){
        this.setState({displayString: displayString+symbol})
      } 
      else {
      this.setState({displayString: displayString+symbol})
      }
    } else if (symbol.match(/\+|\*|\/|%|\.|\u00B2/)) {
      null
    } 
    else {
      this.setState({displayString: displayString+symbol})
    }
  }
  storeData = async (name,value) => {
    try {
      await AsyncStorage.setItem(
        name,
        value
      )
    } catch(err) {
      console.log('Error saving Data', err)
    }
  }

  onChangeLanguage = () => {
    this.storeData('smartCalcLanguageSetting',this.state.language==='ru-RU'?'en-US':'ru-RU' )
    this.setState({language: this.state.language==='ru-RU'?'en-US':'ru-RU'})
    
    
  }

  toggleMenu = () => {
    this.setState({menuHidden: !this.state.menuHidden})
  }
  
  result=''
  
  calculateExpression = () => {
    const { displayString, language } = this.state
    try {
    this.result = evaluate(displayString)
    } catch(err) {
      Alert.alert(language==='en-US'?'Value Error':'Неверное значение', language==='en-US'?'Please Enter valid expression!':'Введите верное арифметическое выражение!')
    }
    if (this.result){
    this.setState({displayString:String(evaluate(displayString))})
    } else {
      Alert.alert(language==='en-US'?'Value Error':'Неверное значение', language==='en-US'?'Please Enter valid expression!':'Введите верное арифметическое выражение!')
    }

  }

  render() {
    const { recordingPermission, query, displayString, darkTheme, language, menuHidden } = this.state
    return (

      <View style={darkTheme?darkStyles.container:styles.container}
      > 
          <View style={styles.optionsContainer}>
            <TouchableOpacity 
            style={styles.optionsOpacity}
            onPress={this.toggleMenu}
            >
              <Text style={darkTheme?darkStyles.optionsButton:styles.optionsButton}>&#8230;</Text>
            </TouchableOpacity>
            <Modal
            isVisible={!menuHidden}
            onBackButtonPress={this.toggleMenu}
            onBackdropPress={this.toggleMenu}
            backdropTransitionOutTiming={500}
            animationOutTiming={700}
            backdropOpacity={0.5}
            animationIn='fadeInUpBig'
            animationInTiming={500}
            animationOut='fadeOutDownBig'
            >
              <View 
              style={styles.optionsMenu}
              >       
                <View style={{flex:1}}>
                  <Text style={{fontSize:20, marginBottom:10}}>{'Settings:'}</Text>
                  <View style={styles.languageChoice}>
                    <Text style={styles.language}>{'Language: '}</Text> 
                    <TouchableOpacity
                    onPress={this.onChangeLanguage}
                    >
                      <Text style= {styles.languageOption}>{language==='en-US'?'English':'Русский'}</Text>
                    </TouchableOpacity>
                  </View>
                </View>
                <View style={{alignItems:"flex-end"}}>
                  <TouchableOpacity
                  onPress={this.toggleMenu}
                  >
                    <Text style={{fontSize:20, fontWeight: 'bold', color: '#3b5998'}}>OK</Text>
                  </TouchableOpacity>
                </View>
              </View>
          </Modal>
          </View>
          <View style={styles.display}>
              <Text style={darkTheme?darkStyles.displayText:styles.displayText}>{displayString}</Text>
          </View>
          <View style={styles.buttonContainer}>
            <View style={styles.Row}>
              <View style={styles.switchContainer}>
                <Switch 
                onValueChange={this.onChangeTheme}
                style={styles.themeSwitch}
                value={darkTheme}
                thumbColor='#fdb82d'
                trackColor={{false:'grey', true: 'grey'}}
                />
                <Text style={darkTheme?{opacity: 0.7, color:'white'}:{opacity: 0.3}}>{!darkTheme?'Switch to Dark theme': 'Switch to Light theme'}</Text>
              </View>
              <Neomorph
                lightShadowColor='white'
                darkShadowColor='black'
                style={darkTheme? darkStyles.calculatorShadow: styles.calculatorShadow}>
                  <TouchableOpacity
                  style={darkTheme? darkStyles.calculatorButtons:styles.calculatorButtons}
                onPress={this.startRecognition.bind(this)}
                >
                  <Icon name='settings-voice' color={darkTheme?'rgba(255,255,255,0.7)':'black'}/>
                </TouchableOpacity>

              </Neomorph>
            </View>
            <View style={styles.Row}>
              <Neomorph
              lightShadowColor='white'
              darkShadowColor='#fdb82c'
              style={
                {
                  shadowRadius: 2,
                  borderRadius: 32,
                  backgroundColor: '#fbc75d',
                  width:75,
                  height:65,
                  shadowOpacity:0.2
                }                
              }>
                <TouchableOpacity
                style={styles.clearButton}
                onPress={this.clearDisplay}
                >
                  <Text style={styles.clearText}>C</Text>
                </TouchableOpacity>
              </Neomorph>
              <Neomorph
              lightShadowColor='white'
              darkShadowColor={`${darkTheme?'black':'#fdb82c'}`}
              style={darkTheme?darkStyles.functionsShadow:styles.functionsShadow}>
                <TouchableOpacity
                style={darkTheme?darkStyles.functionButtons:styles.functionButtons}
                onPress={() => this.addSymbol('(')}
                >
                  <Text style={darkTheme?darkStyles.buttonText:styles.buttonText}>(</Text>
                </TouchableOpacity>
              </Neomorph>
              <Neomorph
              lightShadowColor='white'
              darkShadowColor={`${darkTheme?'black':'#fdb82c'}`}
              style={darkTheme?darkStyles.functionsShadow:styles.functionsShadow}>
                <TouchableOpacity
                style={darkTheme?darkStyles.functionButtons:styles.functionButtons}
                onPress={() => this.addSymbol(')')}
                >
                  <Text style={darkTheme?darkStyles.buttonText:styles.buttonText}>)</Text>
                </TouchableOpacity>
              </Neomorph>
              <Neomorph
              lightShadowColor='white'
              darkShadowColor={`${darkTheme?'black':'#9a2bf1'}`}
              style={ darkTheme?darkStyles.operationsShadow:styles.operationsShadow}>
                <TouchableOpacity
                style={darkTheme?darkStyles.operationsButtons:styles.operationsButtons}
                onPress={() => this.addSymbol('*')}
                >
                  <Text style={darkTheme?darkStyles.buttonText:styles.buttonText}>&#xd7;</Text>
                </TouchableOpacity>
              </Neomorph>
            </View>
            <View style={styles.Row}>
              <Neomorph
                lightShadowColor='white'
                darkShadowColor={`${darkTheme?'black':'#fdb82c'}`}
                style={darkTheme?darkStyles.functionsShadow:styles.functionsShadow}>
                  <TouchableOpacity
                  style={darkTheme?darkStyles.functionButtons:styles.functionButtons}
                  onPress={() => this.addSymbol(`\u221A`)}
                  >
                    <Text style={darkTheme?darkStyles.buttonText:styles.buttonText}>&#8730;</Text>
                  </TouchableOpacity>
                </Neomorph>
                <Neomorph
                lightShadowColor='white'
                darkShadowColor={`${darkTheme?'black':'#fdb82c'}`}
                style={darkTheme?darkStyles.functionsShadow:styles.functionsShadow}>
                  <TouchableOpacity
                  style={darkTheme?darkStyles.functionButtons:styles.functionButtons}
                  onPress={() => this.addSymbol(`%`)}
                  >
                    <Text style={darkTheme?darkStyles.buttonText:styles.buttonText}>&#37;</Text>
                  </TouchableOpacity>
                </Neomorph>
                <Neomorph
                lightShadowColor='white'
                darkShadowColor={`${darkTheme?'black':'#fdb82c'}`}
                style={darkTheme?darkStyles.functionsShadow:styles.functionsShadow}>
                  <TouchableOpacity
                  style={darkTheme?darkStyles.functionButtons:styles.functionButtons}
                  onPress={() => this.addSymbol('\u00B2')}
                  >
                    <Text style={darkTheme?darkStyles.buttonText:styles.buttonText}>x&#178;</Text>
                    </TouchableOpacity>
                </Neomorph>
                <Neomorph
                lightShadowColor='white'
                darkShadowColor={`${darkTheme?'black':'#9a2bf1'}`}
                style={ darkTheme?darkStyles.operationsShadow:styles.operationsShadow}>
                  <TouchableOpacity
                  style={darkTheme?darkStyles.operationsButtons:styles.operationsButtons}
                  onPress={() => this.addSymbol(`/`)}
                  >
                    <Text style={darkTheme?darkStyles.buttonText:styles.buttonText}>&#xf7;</Text>
                  </TouchableOpacity>
                </Neomorph>
            </View>
            <View style={styles.Row}>
              <Neomorph
                lightShadowColor='white'
                darkShadowColor='black'
                style={darkTheme? darkStyles.calculatorShadow: styles.calculatorShadow}>
                  <TouchableOpacity
                  style={darkTheme? darkStyles.calculatorButtons:styles.calculatorButtons}
                  onPress={() => this.addSymbol('7')}
                  >
                    <Text style={darkTheme?darkStyles.buttonText:styles.buttonText}>7</Text>
                  </TouchableOpacity>
                </Neomorph>

                <Neomorph
                lightShadowColor='white'
                darkShadowColor='black'
                style={darkTheme? darkStyles.calculatorShadow: styles.calculatorShadow}>
                  <TouchableOpacity
                  style={darkTheme? darkStyles.calculatorButtons:styles.calculatorButtons}
                  onPress={() => this.addSymbol('8')}
                  >
                    <Text style={darkTheme?darkStyles.buttonText:styles.buttonText}>8</Text>
                  </TouchableOpacity>
                </Neomorph>
                <Neomorph
                lightShadowColor='white'
                darkShadowColor='black'
                style={darkTheme? darkStyles.calculatorShadow: styles.calculatorShadow}>
                  <TouchableOpacity
                  style={darkTheme? darkStyles.calculatorButtons:styles.calculatorButtons}
                  onPress={() => this.addSymbol("9")}
                  >
                    <Text style={darkTheme?darkStyles.buttonText:styles.buttonText}>9</Text>
                  </TouchableOpacity>
                </Neomorph>
                <Neomorph
                lightShadowColor='white'
                darkShadowColor={`${darkTheme?'black':'#9a2bf1'}`}
                style={ darkTheme?darkStyles.operationsShadow:styles.operationsShadow}>
                  <TouchableOpacity
                  style={darkTheme?darkStyles.operationsButtons:styles.operationsButtons}
                  onPress={() => this.addSymbol(`-`)}
                  >
                    <Text style={darkTheme?darkStyles.buttonText:styles.buttonText}>-</Text>
                  </TouchableOpacity>
                </Neomorph>
            </View>
            <View style={styles.Row}>
              <Neomorph
                lightShadowColor='white'
                darkShadowColor='black'
                style={darkTheme? darkStyles.calculatorShadow: styles.calculatorShadow}>
                  <TouchableOpacity
                  style={darkTheme? darkStyles.calculatorButtons:styles.calculatorButtons}
                onPress={() => this.addSymbol("4")}
                >
                  <Text style={darkTheme?darkStyles.buttonText:styles.buttonText}>4</Text>
                </TouchableOpacity>
              </Neomorph>
              <Neomorph
                lightShadowColor='white'
                darkShadowColor='black'
                style={darkTheme? darkStyles.calculatorShadow: styles.calculatorShadow}>
                  <TouchableOpacity
                  style={darkTheme? darkStyles.calculatorButtons:styles.calculatorButtons}
                onPress={() => this.addSymbol("5")}
                >
                  <Text style={darkTheme?darkStyles.buttonText:styles.buttonText}>5</Text>
                </TouchableOpacity>
              </Neomorph>
              <Neomorph
                lightShadowColor='white'
                darkShadowColor='black'
                style={darkTheme? darkStyles.calculatorShadow: styles.calculatorShadow}>
                  <TouchableOpacity
                  style={darkTheme? darkStyles.calculatorButtons:styles.calculatorButtons}
                onPress={() => this.addSymbol("6")}
                >
                  <Text style={darkTheme?darkStyles.buttonText:styles.buttonText}>6</Text>
                </TouchableOpacity>
              </Neomorph>
              <Neomorph
                lightShadowColor='white'
                darkShadowColor={`${darkTheme?'black':'#9a2bf1'}`}
                style={ darkTheme?darkStyles.operationsShadow:styles.operationsShadow}>
                  <TouchableOpacity
                  style={darkTheme?darkStyles.operationsButtons:styles.operationsButtons}
                onPress={() => this.addSymbol('+')}
                >
                  <Text style={darkTheme?darkStyles.buttonText:styles.buttonText}>+</Text>
                </TouchableOpacity>
              </Neomorph>
            </View>
            <View style={styles.lastRow}>
                  <View >
                      <Neomorph
                      lightShadowColor='white'
                      darkShadowColor='black'
                      style={darkTheme? darkStyles.calculatorTopShadow: styles.calculatorTopShadow}>
                        <TouchableOpacity
                        style={darkTheme? darkStyles.calculatorButtonsLast:styles.calculatorButtonsLast}
                        onPress={() => this.addSymbol("1")}
                        >
                          <Text style={darkTheme?darkStyles.buttonText:styles.buttonText}>1</Text>
                        </TouchableOpacity>
                      </Neomorph>
                      <Neomorph
                      lightShadowColor='white'
                      darkShadowColor='black'
                      style={darkTheme? darkStyles.calculatorShadow: styles.calculatorShadow}>
                        <TouchableOpacity
                        style={darkTheme? darkStyles.calculatorButtons:styles.calculatorButtons}
                        onPress={() => this.addSymbol(`.`)}
                        >
                          <Text style={darkTheme?darkStyles.buttonText:styles.buttonText}>.</Text>
                        </TouchableOpacity>
                      </Neomorph>
                  </View>    
                  <View>    
                      <Neomorph
                      lightShadowColor='white'
                      darkShadowColor='black'
                      style={darkTheme? darkStyles.calculatorTopShadow: styles.calculatorTopShadow}>
                        <TouchableOpacity
                        style={darkTheme? darkStyles.calculatorButtonsLast:styles.calculatorButtonsLast}
                        onPress={() => this.addSymbol("2")}
                        >          
                          <Text style={darkTheme?darkStyles.buttonText:styles.buttonText}>2</Text>
                        </TouchableOpacity>
                      </Neomorph>
                      <Neomorph
                      lightShadowColor='white'
                      darkShadowColor='black'
                      style={darkTheme? darkStyles.calculatorShadow: styles.calculatorShadow}>
                        <TouchableOpacity
                        style={darkTheme? darkStyles.calculatorButtons:styles.calculatorButtons}
                        onPress={() => this.addSymbol("0")}
                        >
                          <Text style={darkTheme?darkStyles.buttonText:styles.buttonText}>0</Text>
                        </TouchableOpacity>
                      </Neomorph>
                  </View>
                  <View>
                      <Neomorph
                      lightShadowColor='white'
                      darkShadowColor='black'
                      style={darkTheme? darkStyles.calculatorTopShadow: styles.calculatorTopShadow}>
                        <TouchableOpacity
                        style={darkTheme? darkStyles.calculatorButtonsLast:styles.calculatorButtonsLast}
                        onPress={() => this.addSymbol("3")}
                        >
                          <Text style={darkTheme?darkStyles.buttonText:styles.buttonText}>3</Text>
                        </TouchableOpacity>
                      </Neomorph>
                      <Neomorph
                      lightShadowColor='white'
                      darkShadowColor='black'
                      style={darkTheme? darkStyles.calculatorShadow: styles.calculatorShadow}>
                        <TouchableOpacity
                        style={darkTheme? darkStyles.calculatorButtons:styles.calculatorButtons}
                        onPress={this.clearLastSymbol}
                        >
                          <Icon name='backspace' color={darkTheme?'rgba(248, 248, 250,0.5)':'black'}/>
                        </TouchableOpacity>
                      </Neomorph>
                  </View>
                  
                  <View style={styles.calculateContainer}>
                    <Neomorph
                    lightShadowColor='white'
                    darkShadowColor='#9b2cf2'
                    style={darkTheme?darkStyles.calculateShadow: styles.calculateShadow}>
                      <LinearGradient colors={['#9b2cf2','#b468f0','#c07df4']} style={styles.calculateButton}>
                        <TouchableOpacity
                        style={styles.calculateButton}
                        onPress={() => this.calculateExpression()}
                        >
                          <Text style={styles.calculateText}>&#61;</Text>
                        </TouchableOpacity>
                      </LinearGradient>
                    </Neomorph>
                  </View>
              </View>
          </View>
      </View>


    )
  };
}

const styles = StyleSheet.create( {

  container: {
    flex: 1,
    backgroundColor: '#e8ecee',
    padding:20,
    elevation:1
  },

  switchContainer: {
    flexDirection: 'row',
    alignItems:'center'
  },
  
  display:{
    height:'25%',
    justifyContent:'flex-end',
    alignItems: 'flex-end',
    paddingBottom: 10
  },
  optionsContainer: {
    justifyContent: 'flex-start',
    alignItems: 'flex-end'
  },
  Row: {
    flexDirection: "row",
    marginBottom:6,
    justifyContent: 'space-between'
  },  
  clearButton: {
    width:75,
    height:65,
    justifyContent:'center',
    alignItems: 'center',
    backgroundColor: '#fdb82c',
    borderRadius: 32,
    
  },
  functionButtons: {
    width:75,
    height:65,
    justifyContent:'center',
    alignItems: 'center',
    backgroundColor: '#f4f0e4',
    borderRadius: 32,
    
  },
  operationsButtons: {
    width:75,
    height:65,
    justifyContent:'center',
    alignItems: 'center',
    backgroundColor: '#e1d5e9',
    borderRadius: 32,
    
  },
  calculatorButtons: {
    width:75,
    height:65,
    justifyContent:'center',
    alignItems: 'center',
    backgroundColor: '#e8ecee',
    borderRadius: 32,
    
  },
  calculatorButtonsLast: {
    width:75,
    height:65,
    justifyContent:'center',
    alignItems: 'center',
    backgroundColor: '#e8ecee',
    borderRadius: 32,
  },
  calculateButton: {
    width:75,
    height:134,
    justifyContent:'center',
    alignItems: 'center',

    borderRadius: 32,
    
  },
  calculateContainer: {
    width:75,
 
  },
  lastRow: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  functionsShadow: {
    shadowRadius: 1,
    borderRadius: 32,
    backgroundColor: '#fdb82c',
    width:75,
    height:65,
    shadowOpacity: 0.5
  
  },
  operationsShadow:                 {
    shadowRadius: 2,
    borderRadius: 32,
    backgroundColor: '#c07df4',
    width:75,
    height:65,
    shadowOpacity: 0.3
  },
  calculatorShadow:                 {
    shadowRadius: 2,
    borderRadius: 32,
    backgroundColor: '#dcdede',
    width:75,
    height:65,
    shadowOpacity: 0.2
  },
  calculatorTopShadow:                 {
    shadowRadius: 2,
    borderRadius: 32,
    backgroundColor: '#dcdede',
    width:75,
    height:65,
    shadowOpacity: 0.2,
    marginBottom: 4
  },
  calculateShadow:                 {
    shadowRadius: 4,
    borderRadius: 32,
    backgroundColor: '#a640f6',
    width:75,
    height:134,
    shadowOpacity: 0.4
  },
  clearText: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold'
  },
  calculateText: {
    color: 'white',
    fontSize: 38,
    fontWeight: 'bold'
  },
  buttonText: {
    color:'#181818',
    fontSize: 20,
    fontWeight: 'bold'
  },
  displayText: {
    fontSize: 30,
    textAlign: "right"
    
  },
  optionsButton: {
    fontSize: 35,
    fontWeight: 'bold'
  },
  optionsOpacity: {
    width: 60,
    height: 20,
    justifyContent:'flex-end',
    alignItems: 'flex-end',
  },
  languageChoice: {
    flexDirection: 'row'
  },
  optionsMenu: {
    width: '100%',
    height: 200,
    zIndex:1,
    backgroundColor:'#e8ecee',
    borderRadius:15,
    elevation: 4,
    padding:15
  },
  language: {
    fontSize: 18,
    opacity: 0.4
  },
  languageOption:{
    fontSize: 18
  }


});


const darkStyles = StyleSheet.create ({
  container: {
    flex: 1,
    backgroundColor: '#3c3c3c',
    padding:20,
    elevation:1
  },
  optionsButton: {
    fontSize: 35,
    fontWeight: 'bold',
    color: '#ececec'
  },
  calculatorButtons: {
    width:75,
    height:65,
    justifyContent:'center',
    alignItems: 'center',
    backgroundColor: '#3c3c3c',
    borderRadius: 32,

    
  },
  calculatorShadow:  {
    shadowRadius: 2,
    borderRadius: 32,
    backgroundColor: '#3c3c3c',
    width:75,
    height:65,
    shadowOpacity: 0.2,
  },
  calculateShadow:                 {
    shadowRadius: 4,
    borderRadius: 32,
    backgroundColor: '#a640f6',
    width:75,
    height:134,
    shadowOpacity: 0.2
  },
  calculatorButtonsLast: {
    width:75,
    height:65,
    justifyContent:'center',
    alignItems: 'center',
    backgroundColor: '#3c3c3c',
    borderRadius: 32,
  },
  calculatorTopShadow:                 {
    shadowRadius: 2,
    borderRadius: 32,
    backgroundColor: '#3c3c3c',
    width:75,
    height:65,
    shadowOpacity: 0.2,
    marginBottom: 4
  },
  buttonText: {
    color:'rgba(248, 248, 250,0.5)',
    fontSize: 20,
    fontWeight: 'bold'
  },
  operationsButtons: {
    width:75,
    height:65,
    justifyContent:'center',
    alignItems: 'center',
    backgroundColor: '#631c9b',
    borderRadius: 32,
    
  },  
  operationsShadow:                 {
    shadowRadius: 2,
    borderRadius: 32,
    backgroundColor: '#360f54',
    width:75,
    height:65,
    shadowOpacity: 0.2
  },
  functionButtons: {
    width:75,
    height:65,
    justifyContent:'center',
    alignItems: 'center',
    backgroundColor: '#95690e',
    borderRadius: 32,
    
  },
  functionsShadow: {
    shadowRadius: 1,
    borderRadius: 32,
    backgroundColor: '#7c570b',
    width:75,
    height:65,
    shadowOpacity: 0.2
  
  },
  displayText: {
    fontSize: 30,
    textAlign: "right",
    color:'rgba(255,255,255,0.7)'
  },
})

export default App;
