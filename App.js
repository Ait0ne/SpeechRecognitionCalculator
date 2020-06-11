

import React from 'react';
import { StyleSheet, Text, View, Switch, TouchableOpacity, Alert} from 'react-native';
import { Icon } from 'react-native-elements'
import Voice from '@react-native-community/voice';
import { Neomorph } from 'react-native-neomorph-shadows';
import LinearGradient from 'react-native-linear-gradient';
import evaluate from './evaluation';
import Modal from 'react-native-modal';

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
  componentDidMount() {
    // Audio.getPermissionsAsync().then(res  => {
    //   res.granted? this.setState({recordingPermission: true}) : 
    //   Audio.requestPermissionsAsync().then(res => res.granted ? this.setState({recordingPermission: true}): null).catch(err => console.log(err.message)) 
    // }).catch(err => console.log(`main: ${err.message} `))

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
    } else {
      str = str.replace(/square root from|squared root of|squared root from|root of|root from|square root of/g,'\u221A')
      str = str.replace(/squared|to the power of two|\^ 2/g,'\u00B2')
      str = str.replace(/opening bracket|open bracket/g,'(')
      str = str.replace(/closing bracket|close bracket/g,')')
    }
    str = str.replace(/of|от/g,'*')   

    this.setState({
      results: e.value,
      displayString: this.state.displayString+str

    });
  }

  }

  async startRecognition(e) {
    this.setState({
      results:[]
    })
    try {
      await Voice.start(`${this.state.language}`);
    } catch (e) {
      console.error(e);
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

  onChangeLanguage = () => {
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

      <View style={styles.container}
      > 
          <View style={styles.optionsContainer}>
            <TouchableOpacity 
            style={styles.optionsOpacity}
            onPress={this.toggleMenu}
            >
              <Text style={styles.optionsButton}>&#8230;</Text>
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
                  <Text style={{fontSize:20, marginBottom:10}}>{language==='ru-RU'?'Настройки:':'Settings:'}</Text>
                  <View style={styles.languageChoice}>
                    <Text style={styles.language}>{language==='en-US'?'Language: ':'Язык: '}</Text> 
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
              <Text style={styles.displayText}>{displayString}</Text>
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
                <Text style={{opacity: 0.3}}>{!darkTheme?'Switch to Dark theme': 'Switch to Light theme'}</Text>
              </View>
              <Neomorph
                lightShadowColor='white'
                darkShadowColor='#181818'
                style={ styles.calculatorShadow}>
                <TouchableOpacity
                style={styles.calculatorButtons}
                onPress={this.startRecognition.bind(this)}
                >
                  <Icon name='settings-voice'/>
                </TouchableOpacity>

              </Neomorph>
            </View>
            <View style={styles.Row}>
              <Neomorph
              lightShadowColor='white'
              darkShadowColor='#fdb82c'
              style={
                {
                  shadowRadius: 4,
                  borderRadius: 32,
                  backgroundColor: '#fbc75d',
                  width:75,
                  height:65,
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
              darkShadowColor='#fdb82c'
              style={styles.functionsShadow}>
                <TouchableOpacity
                style={styles.functionButtons}
                onPress={() => this.addSymbol('(')}
                >
                  <Text style={styles.buttonText}>(</Text>
                </TouchableOpacity>
              </Neomorph>
              <Neomorph
              lightShadowColor='white'
              darkShadowColor='#fdb82c'
              style={styles.functionsShadow}>
                <TouchableOpacity
                style={styles.functionButtons}
                onPress={() => this.addSymbol(')')}
                >
                  <Text style={styles.buttonText}>)</Text>
                </TouchableOpacity>
              </Neomorph>
              <Neomorph
              lightShadowColor='white'
              darkShadowColor='#9a2bf1'
              style={ styles.operationsShadow}>
                <TouchableOpacity
                style={styles.operationsButtons}
                onPress={() => this.addSymbol('*')}
                >
                  <Text style={styles.buttonText}>&#xd7;</Text>
                </TouchableOpacity>
              </Neomorph>
            </View>
            <View style={styles.Row}>
              <Neomorph
                lightShadowColor='white'
                darkShadowColor='#fdb82c'
                style={styles.functionsShadow}>
                  <TouchableOpacity
                  style={styles.functionButtons}
                  onPress={() => this.addSymbol(`\u221A`)}
                  >
                    <Text style={styles.buttonText}>&#8730;</Text>
                  </TouchableOpacity>
                </Neomorph>
                <Neomorph
                lightShadowColor='white'
                darkShadowColor='#fdb82c'
                style={styles.functionsShadow}>
                  <TouchableOpacity
                  style={styles.functionButtons}
                  onPress={() => this.addSymbol(`%`)}
                  >
                    <Text style={styles.buttonText}>&#37;</Text>
                  </TouchableOpacity>
                </Neomorph>
                <Neomorph
                lightShadowColor='white'
                darkShadowColor='#fdb82c'
                style={styles.functionsShadow}>
                  <TouchableOpacity
                  style={styles.functionButtons}
                  onPress={() => this.addSymbol('\u00B2')}
                  >
                    <Text style={styles.buttonText}>x&#178;</Text>
                    </TouchableOpacity>
                </Neomorph>
                <Neomorph
                lightShadowColor='white'
                darkShadowColor='#9a2bf1'
                style={ styles.operationsShadow}>
                  <TouchableOpacity
                  style={styles.operationsButtons}
                  onPress={() => this.addSymbol(`/`)}
                  >
                    <Text style={styles.buttonText}>&#xf7;</Text>
                  </TouchableOpacity>
                </Neomorph>
            </View>
            <View style={styles.Row}>
              <Neomorph
                lightShadowColor='white'
                darkShadowColor='#181818'
                style={ styles.calculatorShadow}>
                  <TouchableOpacity
                  style={styles.calculatorButtons}
                  onPress={() => this.addSymbol('7')}
                  >
                    <Text style={styles.buttonText}>7</Text>
                  </TouchableOpacity>
                </Neomorph>
              {/* <View style={styles.Row}> */}
                <Neomorph
                lightShadowColor='white'
                darkShadowColor='#181818'
                style={ styles.calculatorShadow}>
                  <TouchableOpacity
                  style={styles.calculatorButtons}
                  onPress={() => this.addSymbol('8')}
                  >
                    <Text style={styles.buttonText}>8</Text>
                  </TouchableOpacity>
                </Neomorph>
                <Neomorph
                lightShadowColor='white'
                darkShadowColor='#181818'
                style={ styles.calculatorShadow}>
                  <TouchableOpacity
                  style={styles.calculatorButtons}
                  onPress={() => this.addSymbol("9")}
                  >
                    <Text style={styles.buttonText}>9</Text>
                  </TouchableOpacity>
                </Neomorph>
                <Neomorph
                lightShadowColor='white'
                darkShadowColor='#9a2bf1'
                style={ styles.operationsShadow}>
                  <TouchableOpacity
                  style={styles.operationsButtons}
                  onPress={() => this.addSymbol(`-`)}
                  >
                    <Text style={styles.buttonText}>-</Text>
                  </TouchableOpacity>
                </Neomorph>
            </View>
            <View style={styles.Row}>
              <Neomorph
                lightShadowColor='white'
                darkShadowColor='#181818'
                style={ styles.calculatorShadow}>
                <TouchableOpacity
                style={styles.calculatorButtons}
                onPress={() => this.addSymbol("4")}
                >
                  <Text style={styles.buttonText}>4</Text>
                </TouchableOpacity>
              </Neomorph>
              <Neomorph
                lightShadowColor='white'
                darkShadowColor='#181818'
                style={ styles.calculatorShadow}>
                <TouchableOpacity
                style={styles.calculatorButtons}
                onPress={() => this.addSymbol("5")}
                >
                  <Text style={styles.buttonText}>5</Text>
                </TouchableOpacity>
              </Neomorph>
              <Neomorph
                lightShadowColor='white'
                darkShadowColor='#181818'
                style={ styles.calculatorShadow}>
                <TouchableOpacity
                style={styles.calculatorButtons}
                onPress={() => this.addSymbol("6")}
                >
                  <Text style={styles.buttonText}>6</Text>
                </TouchableOpacity>
              </Neomorph>
              <Neomorph
                lightShadowColor='white'
                darkShadowColor='#9a2bf1'
                style={ styles.operationsShadow}>
                <TouchableOpacity
                style={styles.operationsButtons}
                onPress={() => this.addSymbol('+')}
                >
                  <Text style={styles.buttonText}>+</Text>
                </TouchableOpacity>
              </Neomorph>
            </View>
            <View style={styles.lastRow}>
                  <View >
                      <Neomorph
                      lightShadowColor='white'
                      darkShadowColor='#181818'
                      style={ styles.calculatorTopShadow}>
                        <TouchableOpacity
                        style={styles.calculatorButtonsLast}
                        onPress={() => this.addSymbol("1")}
                        >
                          <Text style={styles.buttonText}>1</Text>
                        </TouchableOpacity>
                      </Neomorph>
                      <Neomorph
                      lightShadowColor='white'
                      darkShadowColor='#181818'
                      style={ styles.calculatorShadow}>
                        <TouchableOpacity
                        style={styles.calculatorButtons}
                        onPress={() => this.addSymbol(`.`)}
                        >
                          <Text style={styles.buttonText}>.</Text>
                        </TouchableOpacity>
                      </Neomorph>
                  </View>    
                  <View>    
                      <Neomorph
                      lightShadowColor='white'
                      darkShadowColor='#181818'
                      style={ styles.calculatorTopShadow}>
                        <TouchableOpacity
                        style={styles.calculatorButtonsLast}
                        onPress={() => this.addSymbol("2")}
                        >          
                          <Text style={styles.buttonText}>2</Text>
                        </TouchableOpacity>
                      </Neomorph>
                      <Neomorph
                      lightShadowColor='white'
                      darkShadowColor='#181818'
                      style={ styles.calculatorShadow}>
                        <TouchableOpacity
                        style={styles.calculatorButtons}
                        onPress={() => this.addSymbol("0")}
                        >
                          <Text style={styles.buttonText}>0</Text>
                        </TouchableOpacity>
                      </Neomorph>
                  </View>
                  <View>
                      <Neomorph
                      lightShadowColor='white'
                      darkShadowColor='#181818'
                      style={ styles.calculatorTopShadow}>
                        <TouchableOpacity
                        style={styles.calculatorButtonsLast}
                        onPress={() => this.addSymbol("3")}
                        >
                          <Text style={styles.buttonText}>3</Text>
                        </TouchableOpacity>
                      </Neomorph>
                      <Neomorph
                      lightShadowColor='white'
                      darkShadowColor='#181818'
                      style={ styles.calculatorShadow}>
                        <TouchableOpacity
                        style={styles.calculatorButtons}
                        onPress={this.clearLastSymbol}
                        >
                          <Icon name='backspace'/>
                        </TouchableOpacity>
                      </Neomorph>
                  </View>
                  
                  <View style={styles.calculateContainer}>
                    <Neomorph
                    lightShadowColor='white'
                    darkShadowColor='#9b2cf2'
                    style={ styles.calculateShadow}>
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

const styles = StyleSheet.create({

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

export default App;
