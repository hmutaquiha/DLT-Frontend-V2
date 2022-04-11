import React, { useEffect, useState } from "react";
import { Platform, View, KeyboardAvoidingView, ScrollView } from 'react-native';
import { Center, Box, Text, Heading, VStack, FormControl, Input, HStack, InfoIcon, Alert, Button, Image, useToast } from 'native-base';
import { navigate } from '../../routes/NavigationRef';
import { Formik } from 'formik';
import { Q } from '@nozbe/watermelondb'
import NetInfo from "@react-native-community/netinfo";
import SyncIndicator from '../../components/SyncIndicator';
import { database } from '../../database';
import { UsersModel } from '../../models/User';
import { LOGIN_API_URL } from '../../services/api';
import { sync } from "../../database/sync";

interface LoginData{
    username?: string | undefined;
    password?: string | undefined;
}

const Login: React.FC = () => {
    const [loggedUser, setLoggedUser] = useState<any>(undefined);
    const [isInvalidCredentials, setIsInvalidCredentials] = useState(false);
    const [loading, setLoading] = useState(false);
    const [isOffline, setIsOffline] = useState(false);

    const toast = useToast();

    const users = database.collections.get('users');


    useEffect(() => {
        const removeNetInfoSubscription = NetInfo.addEventListener((state) => {
          const offline = !(state.isConnected && state.isInternetReachable);
          setIsOffline(offline);
        });
        return () => removeNetInfoSubscription();
    }, []);

    // watch changes to loggedUser, sync 
    useEffect(() => {

        if(loggedUser){
            
            sync({username: loggedUser.username})
                .then(() => toast.show({description: "Synced Successfully", placement: "top"}))
                .catch(() => toast.show({description: "Sync failed!", placement: "top"}))

            navigate({name: "Main", params: {loggedUser: loggedUser}});
        }
      
    }, [loggedUser]);

    const validate = (values: any) => {
        const errors: LoginData = {}; 

        if (!values.username) {
          errors.username = 'Required';
        }
      
        if (!values.password) {
            errors.password = 'Required';
        }

        return errors;
    };

    const onSubmit = async (values: any) => {
        setLoading(true);
        //unsubscribe();

        // check if users table is synced
        var checkSynced = await users.query(
            Q.where('_status', 'synced'),
        ).fetchCount(); 
        console.log(checkSynced);
        if(checkSynced == 0){ // checkSynced=0 when db have not synced yet
        

            if(isOffline){
                return toast.show({
                    placement: "top",
                    title: "Sem Conexão a Internet",
                    status: "warning",
                    description: "Conecte-se a Internet para o primeiro Login!"
                });
            }
            
            await fetch(`${LOGIN_API_URL}?username=${values.username}&password=${values.password}`)
                    .then(response => response.json())
                    .then(response => {
    
                        if(response.status && response.status !== 200){ // unauthorized
       
                            setIsInvalidCredentials(true); 
                        }else{
           
                            setIsInvalidCredentials(false);   
                            setLoggedUser(response.account);   
                        }
                    })
                    .catch(error =>{
       
                        return toast.show({
                            placement: "top",
                            title: "Falha de Conexão",
                            status: "error",
                            description: "Por favor contacte o suporte!"
                          })
                    });
       
        } else {
            var logguedUser = await users.query( Q.where('username', values.username), 
                                                    Q.where('password', values.password)).fetch();
            
            if(!logguedUser.length){
 
                setIsInvalidCredentials(true); 
            }else{

                setIsInvalidCredentials(false);   
                setLoggedUser(logguedUser[0]._raw);
            }
            
        }
    };

    return (
        <KeyboardAvoidingView>
            <ScrollView contentInsetAdjustmentBehavior="automatic">
            <Box safeArea p="2" w="100%"  py="8" >
            <VStack space={4} alignItems="center" w="100%" >
                <Center w="90%" >
                    <Heading mt="1" color="coolGray.600" 
                                    _dark={{ color: "warmGray.200" }} 
                                    fontWeight="medium" size="md"  py="5">
                        <Text color="warmGray.400">Dreams Layering Tool 1</Text>
                    </Heading>
                    <Heading  color="coolGray.600" 
                                _dark={{ color: "warmGray.200" }} 
                                fontWeight="medium" size="lg" py="2">
                        <Text color="darkBlue.800">Login  </Text>
                    </Heading>
                </Center>
                <Center w="90%" >
                    {isInvalidCredentials ?
                        <Alert w="100%" status='error'>
                            <HStack space={4} flexShrink={1}>
                                <Alert.Icon mt="1" />
                                <Text fontSize="sm" color="coolGray.800">
                                    Utilizador ou Senha Invalidos!
                                </Text>
                            </HStack>
                    
                        </Alert> : <></>
                    }
                </Center>
                <Center w="90%">
                    <Formik initialValues={{
                        username: '',
                        password: ''
                        }} onSubmit={onSubmit} validate={validate}>
                            {({
                                handleChange,
                                handleBlur,
                                handleSubmit,
                                values,
                                errors
                            }) => <VStack space={3} w="100%">
                                <FormControl isRequired isInvalid={'username' in errors}>
                                    <FormControl.Label>Username</FormControl.Label>
             
                                    <Input onBlur={handleBlur('username')} placeholder="Insira o Username" onChangeText={handleChange('username')} value={values.username} />
                                    <FormControl.ErrorMessage>
                                        {errors.username}
                                    </FormControl.ErrorMessage>
                                </FormControl>

                                <FormControl isRequired isInvalid={'password' in errors}>
                                    <FormControl.Label>Password</FormControl.Label>
                                    <Input type="password" onBlur={handleBlur('password')} placeholder="Insira o Password" onChangeText={handleChange('password')} value={values.password} />
                                    <FormControl.ErrorMessage>
                                        {errors.password}
                                    </FormControl.ErrorMessage>
                                </FormControl>

                                <Button onPress={handleSubmit} my="10" colorScheme="primary">
                                    Login
                                </Button>
                            </VStack>
                        }
                    </Formik>
                </Center>
            </VStack>
            </Box>    
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

/*
<KeyboardAvoidingView>
            <ScrollView contentInsetAdjustmentBehavior="automatic">

                <Center w="100%" bgColor="white">
                    <Box safeArea p="2" w="90%"  py="8" >
                        <Center >
                                <Heading mt="1" color="coolGray.600" 
                                                _dark={{ color: "warmGray.200" }} 
                                                fontWeight="medium" size="md"  py="5">
                                    <Text color="warmGray.400">Dreams Layering Tool 1</Text>
                                </Heading>
                                <Heading  color="coolGray.600" 
                                                _dark={{ color: "warmGray.200" }} 
                                                fontWeight="medium" size="lg" px="10">
                                    <Text color="darkBlue.800">Login  </Text>
                                </Heading>
                        </Center>
                        {isNotLogged ?
                            <Alert w="100%" status='error'>
                                
                                    <HStack space={4} flexShrink={1}>
                                        <Alert.Icon mt="1" />
                                        <Text fontSize="sm" color="coolGray.800">
                                            Senha ou Password Invalido!
                                        </Text>
                                    </HStack>
                    
                            </Alert> : <></>
                        }
                        <Formik initialValues={{
                            username: '',
                            password: ''
                            }} onSubmit={onSubmit} validate={validate}>
                                {({
                                    handleChange,
                                    handleBlur,
                                    handleSubmit,
                                    values,
                                    errors
                                }) => <VStack space={3} mt="5">
                                    <FormControl isRequired isInvalid={'username' in errors}>
                                        <FormControl.Label>Username</FormControl.Label>
             
                                        <Input onBlur={handleBlur('username')} placeholder="John" onChangeText={handleChange('username')} value={values.username} />
                                        <FormControl.ErrorMessage>
                                        {errors.username}
                                        </FormControl.ErrorMessage>
                                    </FormControl>

                                    <FormControl isInvalid={'password' in errors}>
                                        <FormControl.Label>Password</FormControl.Label>
                                        <Input onBlur={handleBlur('password')} placeholder="Doe" onChangeText={handleChange('password')} value={values.password} />
                                        <FormControl.ErrorMessage>
                                        {errors.password}
                                        </FormControl.ErrorMessage>
                                    </FormControl>

                                    <Button onPress={handleSubmit} colorScheme="primary">
                                        Login
                                    </Button>
                                </VStack>
                            }
                        </Formik>
                        
                    </Box>
                </Center>
            </ScrollView>
        </KeyboardAvoidingView>
*/

export default Login;