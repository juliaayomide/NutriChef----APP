import React from 'react';
import { useFonts } from "expo-font";
import {
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
} from "@expo-google-fonts/poppins";
import { applyGlobalFont } from "./globalFont";

import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Home from './screens/Home';
import allCategorias from './screens/categoria/AllCategorias';
import Pesquisa from './screens/pesquisa/Pesquisa';
import Resultado from './screens/pesquisa/Resultado';
import Categoria from './screens/categoria/Categoria';
import ReceitaDet from './screens/ReceitasDet';
import Favoritos from './screens/Favoritos';
import CadastroLogin from './screens/cadastroLogin';
import Perfil from './screens/perfil/Perfil';
import ConfigPerfil from './screens/perfil/configPerfil';
import AlterPerfil from './screens/perfil/alterPerfil';
import VerMais from './screens/VerMais';
import NovaReceita from './screens/NovaReceita';

import { UserProvider } from './contexts/UserContext';
import { FavoritesProvider } from './contexts/FavoritesContext';

const Stack = createNativeStackNavigator();

export default function App() {
  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  if (!fontsLoaded) return null;

  applyGlobalFont();


  return (
    <UserProvider>
      <FavoritesProvider>
        <NavigationContainer>
          <Stack.Navigator 
            initialRouteName="Home" 
            screenOptions={{
              headerShown: false,
            }}
          >
            <Stack.Screen name="Home" component={Home} options={{ title: 'Início' }}/>
            <Stack.Screen name="Pesquisa" component={Pesquisa} options={{ title: 'Pesquisas' }}/>
            <Stack.Screen name="Resultado" component={Resultado} options={{ title: 'Resultados'}}/>
            <Stack.Screen name="allCategorias" component={allCategorias} options={{ title: 'Todas as Categorias' }} />
            <Stack.Screen name="Categoria" component={Categoria} options={{ title: 'Categoria'}}/>
            <Stack.Screen name="ReceitaDet" component={ReceitaDet} options={{ title: 'Receita'}}/>
            <Stack.Screen name="Favoritos" component={Favoritos} options={{ title: 'Favoritos'}}/>
            <Stack.Screen name="CadastroLogin" component={CadastroLogin} options={{ title: 'Cadastro e Login' }} />
            <Stack.Screen name="Perfil" component={Perfil} options={{ title: 'Perfil' }}/>
            <Stack.Screen name="AlterPerfil" component={AlterPerfil} options={{ title: 'Alterar Perfil' }}/>
            <Stack.Screen name="ConfigPerfil" component={ConfigPerfil} options={{ title: 'Configurar Perfil' }}/>
            <Stack.Screen name="VerMais" component={VerMais} options={{ title: 'Ver Mais' }}/>
            <Stack.Screen name="NovaReceita" component={NovaReceita} options={{ title: 'Nova Receita' }}/>
          </Stack.Navigator>
        </NavigationContainer>
      </FavoritesProvider>
    </UserProvider>
  );
}
