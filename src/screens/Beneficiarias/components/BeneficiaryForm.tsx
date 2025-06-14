import React, {
  useEffect,
  useState,
  useContext,
  useCallback,
  memo,
} from "react";
import {
  View,
  HStack,
  Text,
  VStack,
  FormControl,
  Input,
  Stack,
  InputGroup,
  InputLeftAddon,
  Center,
  Box,
  Divider,
  Button,
  Radio,
  Modal,
  ScrollView,
  Alert,
  Checkbox,
  useToast,
  CheckCircleIcon,
  WarningTwoIcon,
  InfoIcon,
  QuestionIcon,
} from "native-base";
import Tooltip from "react-native-walkthrough-tooltip";
import { ProgressSteps, ProgressStep } from "react-native-progress-steps";
import { Ionicons } from "@native-base/icons";
import { useFormik } from "formik";
import * as yup from "yup";
import { Picker, PickerProps } from "@react-native-picker/picker";
import { Model, Q } from "@nozbe/watermelondb";
import { database } from "../../../database";
import withObservables from "@nozbe/with-observables";
import Spinner from "react-native-loading-spinner-overlay";
import { navigate, navigationRef } from "../../../routes/NavigationRef";
import moment from "moment";
import { getFormatedDate } from "react-native-modern-datepicker";
import { Context } from "../../../routes/DrawerNavigator";
import { calculateAge } from "../../../models/Utils";
import styles from "./styles";
import {
  SuccessHandler,
  ErrorHandler,
} from "../../../components/SyncIndicator";
import { sync } from "../../../database/sync";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../../../store";
import { MENTOR } from "../../../utils/constants";
import MyDatePicker from "../../../components/DatePicker";
import {
  beneficiariesFetchCount,
  pendingSyncBeneficiaries,
} from "../../../services/beneficiaryService";
import { getBeneficiariesTotal } from "../../../store/beneficiarySlice";
import {
  pendingSyncReferences,
  referencesFetchCount,
} from "../../../services/referenceService";
import NetInfo from "@react-native-community/netinfo";
import { getReferencesTotal } from "../../../store/referenceSlice";
import PropTypes from "prop-types";
import {
  loadPendingsBeneficiariesInterventionsTotals,
  loadPendingsBeneficiariesTotals,
  loadPendingsReferencesTotals,
} from "../../../store/syncSlice";
import { pendingSyncBeneficiariesInterventions } from "../../../services/beneficiaryInterventionService";
import { TouchableOpacity } from "react-native";

const BeneficiaryForm: React.FC = ({
  route,
  subServices,
  beneficiaries_interventions,
}: any) => {
  const loggedUser: any = useContext(Context);

  const idades = [
    "9",
    "10",
    "11",
    "12",
    "13",
    "14",
    "15",
    "16",
    "17",
    "18",
    "19",
    "20",
    "21",
    "22",
    "23",
    "24",
  ];

  const { beneficiary } = route.params;

  const userDetailsCollection = database.get("user_details");

  const [value, setValue] = useState([]);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [items, setItems] = useState([
    { label: "Pais", value: "Pais" },
    { label: "Avos", value: "Avos" },
    { label: "Parceiro", value: "Parceiro" },
    { label: "Sozinho", value: "Sozinho" },
    { label: "Outros familiares", value: "Outros familiares" },
  ]);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [errors, setErrors] = useState(false);
  const [beneficiarie, setBeneficairie] = useState(beneficiary);
  const [provinces, setProvinces] = useState<any>([]);
  const [districts, setDistricts] = useState<any>([]);
  const [userEntryPoint, setUserEntryPoint] = useState<any>();
  const [userLocality, setUserLocality] = useState<any>();
  const [localities, setLocalities] = useState<any>([]);
  const [uss, setUss] = useState<any>([]);
  const [neighborhoods, setNeighborhoods] = useState<any>([]);
  const [isEnable, setIsEnable] = useState(false);
  const [isDisEnable, setIsDisEnable] = useState(false);
  const [isProvEnable, setIsProvEnable] = useState(false);
  const [step, setStep] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [newNui, setNewNui] = useState();
  const [isEdit, setIsEdit] = useState(false);
  const [district, setDistrict] = useState<any>();
  const [isDateRequired, setIsDateRequired] = useState<any>(true);
  const [age, setAge] = useState<any>(undefined);
  const [schoolInfoEnabled, setSchoolInfoEnabled] = useState<any>(true);
  const [deficiencyTypeEnabled, setDeficiencyTypeEnabled] = useState<any>(true);
  const [gbvInfoEnabled, setGbvInfoEnabled] = useState<any>(true);
  const [sexExploitationTimeEnabled, setSexExploitationTimeEnabled] =
    useState<any>(true);
  const [sexWorkerEnable, setsexWorkerEnabled] = useState(false);
  const userDetail = useSelector((state: RootState) => state.auth.userDetails);
  const [searchPartner, setSearchPartner] = useState<any>(undefined);
  const [partnerHasErrors, setPartnerHasErrors] = useState(false);
  const [isUsVisible, setUsVisible] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [isGoToSpecificVblt, setGoToSpecificVblt] = useState(false);
  const [isExistingBeneficiary, setExistingBeneficiary] = useState(false);
  const [beneficiaryState, setBeneficiaryState] = useState<any>();
  const [ignoreExisting, setIgnoreExisting] = useState(false);
  const [toolTipVisible, setToolTipVisible] = useState(false);
  const [exploitationToolTipVisible, setExploitationToolTipVisible] =
    useState(false);
  const [alcoolToolTipVisible, setAlcoolToolTipVisible] = useState(false);
  const [stiToolTipVisible, setStiToolTipVisible] = useState(false);
  const [sexWorkerToolTipVisible, setSexWorkerToolTipVisible] = useState(false);

  const minBirthYear = new Date();
  minBirthYear.setFullYear(new Date().getFullYear() - 24);

  const maxBirthYear = new Date();
  maxBirthYear.setFullYear(new Date().getFullYear() - 9);

  const fetchUpdateData = useCallback(async () => {
    const districtsList = await database
      .get("districts")
      .query(Q.where("province_id", Number(beneficiarie.province_id)))
      .fetch();
    const districts = districtsList.map((item) => item._raw);
    setDistricts(districts);

    const localitiesList = await database
      .get("localities")
      .query(Q.where("district_id", Number(beneficiarie.district_id)))
      .fetch();
    const localities = localitiesList.map((item) => item._raw);
    setLocalities(localities);
    const ussList = await database
      .get("us")
      .query(
        Q.where("locality_id", Number(beneficiarie?.locality_id)),
        Q.where("entry_point", Number(beneficiarie?.entry_point))
      )
      .fetch();
    const usSerialized = ussList.map((item) => item._raw);
    setUss(usSerialized);

    const partnersQ = isNaN(Number(beneficiarie.partner_id))
      ? await database
          .get("beneficiaries")
          .query(Q.where("gender", "1"), Q.where("id", beneficiarie.partner_id))
          .fetch()
      : await database
          .get("beneficiaries")
          .query(
            Q.where("gender", "1"),
            Q.where("online_id", Number(beneficiarie.partner_id))
          )
          .fetch();
    const benefPartiner = partnersQ[0]?._raw;

    handleSearchPartner(benefPartiner?.["nui"]);
  }, []);

  const fetchMetaData = async () => {
    const getProvsList = await database.get("provinces").query().fetch();
    const provSerialized = getProvsList.map((item) => item._raw);
    setProvinces(provSerialized);

    if (userDetail?.provinces[0]?.id != undefined) {
      userDetail?.provinces?.length > 1
        ? setIsProvEnable(true)
        : setIsProvEnable(false);
    }

    if (userDetail?.districts[0]?.id != undefined) {
      const getDistList = await database
        .get("districts")
        .query(Q.where("province_id", userDetail?.provinces[0]?.id))
        .fetch();
      const distsSerialized = getDistList.map((item) => item._raw);
      setDistricts(distsSerialized);

      userDetail?.districts?.length > 1
        ? setIsDisEnable(true)
        : setIsDisEnable(false);

      const getLocList = await database
        .get("localities")
        .query(Q.where("district_id", userDetail.districts[0].id))
        .fetch();
      const locsSerialized = getLocList.map((item) => item._raw);
      setLocalities(locsSerialized);

      if (userDetail?.localities[0]?.id != undefined) {
        const getNeiList = await database
          .get("neighborhoods")
          .query(Q.where("locality_id", Number(userDetail?.localities[0]?.id)))
          .fetch();
        const neiSerialized = getNeiList.map((item) => item._raw);
        setNeighborhoods(neiSerialized);

        userDetail?.districts?.length > 1
          ? setIsEnable(true)
          : userDetail?.localities?.length > 1
          ? setIsEnable(true)
          : setIsEnable(false);
      }
    }

    const userDetailsQ = await userDetailsCollection
      .query(Q.where("user_id", loggedUser.online_id))
      .fetch();
    const userDetailRaw = userDetailsQ[0]?._raw;
    const isUserAllowed =
      userDetailRaw?.["profile_id"] != MENTOR ? true : false;
    setUsVisible(isUserAllowed);
  };

  useEffect(() => {
    fetchMetaData().catch((error) => console.log(error));

    if (beneficiarie) {
      fetchUpdateData().catch((error) => console.log(error));

      setValue(beneficiarie?.vblt_lives_with.split(","));
      setSchoolInfoEnabled(beneficiarie.vblt_is_student == 1);
      setDeficiencyTypeEnabled(beneficiarie.vblt_is_deficient == 1);
      setGbvInfoEnabled(beneficiarie.vblt_vbg_victim == 1);
      setSexExploitationTimeEnabled(beneficiarie.vblt_sexual_exploitation == 1);

      const age = calculateAge(beneficiarie.date_of_birth);
      setAge(age + "");
      formik.setFieldValue("age", age + "");
      setsexWorkerEnabled(age > 17);
    } else {
      const entryPoint =
        formik.values.entry_point !== undefined
          ? formik.values.entry_point
          : loggedUser.entryPoint !== undefined
          ? loggedUser.entryPoint
          : loggedUser.entry_point;
      formik.setFieldValue("entry_point", entryPoint);
    }

    const removeNetInfoSubscription = NetInfo.addEventListener((state) => {
      const status = !(state.isConnected && state.isInternetReachable);
      setIsOffline(status);
    });
    return () => removeNetInfoSubscription();
  }, []);

  useEffect(() => {
    const locality = formik.values.locality;
    const entryPoint = formik.values.entry_point
      ? formik.values.entry_point
      : loggedUser.entry_point;

    const fetchUsList = async () => {
      if (locality && entryPoint) {
        const getUsList = await database
          .get("us")
          .query(
            Q.where("locality_id", Number(locality)),
            Q.where("entry_point", Number(entryPoint))
          )
          .fetch();

        const usSerialized = getUsList.map((item) => item._raw);
        setUss(usSerialized);
      }
    };

    fetchUsList().catch((error) => console.log(error));
    setLoadingData(false);
  }, [userLocality, userEntryPoint]);

  const toast = useToast();
  const dispatch = useDispatch();

  const formik = useFormik({
    initialValues: {
      surname: beneficiarie?.surname,
      name: beneficiarie?.name,
      date_of_birth: beneficiarie?.date_of_birth,
      age: calculateAge(beneficiarie?.date_of_birth),
      nationality: "1",
      enrollment_date: beneficiarie?.enrollment_date,
      province:
        beneficiarie?.province_id === undefined
          ? userDetail?.provinces[0]?.id
          : beneficiarie?.province_id,
      district:
        beneficiarie?.district_id === undefined
          ? userDetail?.districts[0]?.id
          : beneficiarie?.district_id,
      locality:
        beneficiarie?.locality_id === undefined
          ? userDetail?.localities[0]?.id
          : beneficiarie?.locality_id,
      locality_name: beneficiarie?.locality_name,
      entry_point: beneficiarie?.entry_point,
      us_id: beneficiarie?.us_id,
      nick_name: beneficiarie?.nick_name,
      address: beneficiarie?.address,
      phone_number: beneficiarie?.phone_number,
      e_mail: beneficiarie?.e_mail,
      neighborhood_id: beneficiarie?.neighborhood_id,
      partner_id: beneficiarie?.partner_id,
      vblt_lives_with: beneficiarie?.vblt_lives_with,
      vblt_is_student: beneficiarie?.vblt_is_student,
      vblt_school_grade: beneficiarie?.vblt_school_grade,
      vblt_school_name: beneficiarie?.vblt_school_name,
      vblt_is_deficient: beneficiarie?.vblt_is_deficient,
      vblt_deficiency_type: beneficiarie?.vblt_deficiency_type,
      vblt_married_before: beneficiarie?.vblt_married_before,
      vblt_idp: beneficiarie?.vblt_idp,
      vblt_tested_hiv: beneficiarie?.vblt_tested_hiv,
      vblt_sexually_active: beneficiarie?.vblt_sexually_active,
      vblt_pregnant_or_has_children:
        beneficiarie?.vblt_pregnant_or_has_children,
      vblt_multiple_partners: beneficiarie?.vblt_multiple_partners,
      vblt_sexual_exploitation_trafficking_victim:
        beneficiarie?.vblt_sexual_exploitation_trafficking_victim,
      vblt_sexploitation_time: beneficiarie?.vblt_sexploitation_time,
      vblt_vbg_victim: beneficiarie?.vblt_vbg_victim,
      vblt_vbg_type: beneficiarie?.vblt_vbg_type,
      vblt_vbg_time: beneficiarie?.vblt_vbg_time,
      vblt_alcohol_drugs_use: beneficiarie?.vblt_alcohol_drugs_use,
      vblt_sti_history: beneficiarie?.vblt_sti_history,
      vblt_sex_worker: beneficiarie?.vblt_sex_worker,
      vblt_house_sustainer: beneficiarie?.vblt_house_sustainer,
      references_a: beneficiarie?.references_a,
    },
    validationSchema: () =>
      yup.object({
        e_mail: yup.string().email("E-mail invalido!!!"),
        phone_number: yup
          .number()
          .nullable(true)
          .positive("Apenas numeros!!!")
          .integer("Apenas numeros!!!"),
      }),
    onSubmit: (values) => console.log(values),
    validate: (values) => validate(values),
    validateOnBlur: false,
    validateOnChange: false,
  });

  const getTotals = async () => {
    const countBen = await beneficiariesFetchCount();
    dispatch(getBeneficiariesTotal(countBen));

    const countRef = await referencesFetchCount();
    dispatch(getReferencesTotal(countRef));
  };

  const onNextStep = async () => {
    setLoadingData(true);
    let beneficiaries = [] as Model[];

    if (!ignoreExisting && !beneficiarie) {
      beneficiaries = await database
        .get("beneficiaries")
        .query(
          Q.where("name", formik.values?.name),
          Q.where("locality_id", Number(formik.values?.locality)),
          Q.where("date_of_birth", formik.values?.date_of_birth)
        )
        .fetch();
    }

    if (beneficiaries.length > 0) {
      setExistingBeneficiary(true);
      setBeneficiaryState(beneficiaries[0]._raw);
    }

    const errorsList = validate(formik.values);
    const hasErrors = JSON.stringify(errorsList) !== "{}";

    if (hasErrors) {
      setErrors(true);
      formik.setErrors(errorsList);
    } else {
      setErrors(false);
      setStep(2);
    }

    if (partnerHasErrors) {
      setErrors(true);
    }
    setLoadingData(false);
  };

  const onNextStep2 = async () => {
    const errorsList = validate(formik.values);
    const hasErrors = JSON.stringify(errorsList) !== "{}";

    if (hasErrors) {
      setErrors(true);
      formik.setErrors(errorsList);
    } else {
      // save the Beneficiary locally
      const district = districts.filter(
        (d) => d.online_id === formik.values.district
      )[0];
      setDistrict(district);

      if (beneficiarie == undefined) {
        setIsEdit(false);
        setLoading(true);
        const ben: any = await handleSaveBeneficiary();

        setBeneficairie(ben?._raw);
        setNewNui(ben?._raw.nui);
        setLoading(false);
        setGoToSpecificVblt(true);
      } else {
        setIsEdit(true);
      }

      setErrors(false);
      setStep(3);
    }

    if (partnerHasErrors) {
      setErrors(true);
    }

    getTotals().catch((err) => console.error(err));
    fetchCounts();
  };

  const onPreviousStep = () => {
    setStep(1);
  };

  const onPreviousStep2 = () => {
    setStep(2);
  };

  const onChangeCheckbox = (e) => {
    setIsDateRequired(!e);
  };

  const validate = (values: any) => {
    const errors: any = {};
    const errorMessage = "Obrigatório";

    if (step == 1) {
      if (!values.surname) {
        errors.surname = errorMessage;
      }
      if (!values.name) {
        errors.name = errorMessage;
      }
      if (!values.date_of_birth) {
        errors.date_of_birth = errorMessage;
      }
      if (!values.nationality) {
        errors.nationality = errorMessage;
      }
      if (!values.enrollment_date) {
        errors.enrollment_date = errorMessage;
      }
      if (!values.province) {
        errors.province = errorMessage;
      }
      if (!values.district) {
        errors.district = errorMessage;
      }
      if (!values.locality) {
        errors.locality = errorMessage;
      }
      if (!values.entry_point) {
        errors.entry_point = errorMessage;
      }
      if (!values.us_id) {
        errors.us_id = errorMessage;
      }
      if (!values.neighborhood_id) {
        errors.neighborhood_id = errorMessage;
      }
    } else if (step == 2) {
      if (!values.vblt_lives_with) {
        errors.vblt_lives_with = errorMessage;
      }
      if (values.vblt_house_sustainer == null) {
        errors.vblt_house_sustainer = errorMessage;
      }
      if (values.vblt_is_student == null) {
        errors.vblt_is_student = errorMessage;
      }
      if (schoolInfoEnabled && values.vblt_school_grade == null) {
        errors.vblt_school_grade = errorMessage;
      }
      if (schoolInfoEnabled && values.vblt_school_name == null) {
        errors.vblt_school_name = errorMessage;
      }
      if (values.vblt_is_deficient == null) {
        errors.vblt_is_deficient = errorMessage;
      }
      if (deficiencyTypeEnabled && values.vblt_deficiency_type == null) {
        errors.vblt_deficiency_type = errorMessage;
      }
      if (values.vblt_married_before == null) {
        errors.vblt_married_before = errorMessage;
      }
      if (values.vblt_idp == null) {
        errors.vblt_idp = errorMessage;
      }
      if (values.vblt_tested_hiv == null) {
        errors.vblt_tested_hiv = errorMessage;
      }
    } else if (step == 3) {
      if (values.vblt_sexually_active == null) {
        errors.vblt_sexually_active = errorMessage;
      }
      if (values.vblt_pregnant_or_has_children == null) {
        errors.vblt_pregnant_or_has_children = errorMessage;
      }
      if (values.vblt_multiple_partners == null) {
        errors.vblt_multiple_partners = errorMessage;
      }
      if (values.vblt_sexual_exploitation_trafficking_victim == null) {
        errors.vblt_sexual_exploitation_trafficking_victim = errorMessage;
      }
      if (values.vblt_vbg_victim == null) {
        errors.vblt_vbg_victim = errorMessage;
      }
      if (gbvInfoEnabled) {
        if (values.vblt_vbg_type == null) {
          errors.vblt_vbg_type = errorMessage;
        }
        if (values.vblt_vbg_time == null) {
          errors.vblt_vbg_time = errorMessage;
        }
      }
      if (values.vblt_alcohol_drugs_use == null) {
        errors.vblt_alcohol_drugs_use = errorMessage;
      }
      if (values.vblt_sti_history == null) {
        errors.vblt_sti_history = errorMessage;
      }
      if (sexWorkerEnable) {
        if (values.vblt_sex_worker == null) {
          errors.vblt_sex_worker = errorMessage;
        }
      }
    }

    return errors;
  };

  const fetchCounts = async () => {
    const benefNotSynced = await pendingSyncBeneficiaries();
    dispatch(
      loadPendingsBeneficiariesTotals({
        pendingSyncBeneficiaries: benefNotSynced,
      })
    );

    const benefIntervNotSynced = await pendingSyncBeneficiariesInterventions();
    dispatch(
      loadPendingsBeneficiariesInterventionsTotals({
        pendingSyncBeneficiariesInterventions: benefIntervNotSynced,
      })
    );

    const refNotSynced = await pendingSyncReferences();
    dispatch(
      loadPendingsReferencesTotals({ pendingSyncReferences: refNotSynced })
    );
  };

  const handleSaveBeneficiary = async () => {
    const district = districts.filter(
      (d) => d.online_id === formik.values.district
    )[0];
    setDistrict(district);

    const isEdit = beneficiarie && beneficiarie?.id;
    setIsEdit(isEdit);

    const newObject = await database.write(async () => {
      const locality = localities.filter(
        (item) => item.online_id === formik.values.locality
      )[0];
      const organization_id =
        loggedUser.partner_id == undefined
          ? loggedUser.partners?.id
          : loggedUser.partner_id;

      if (isEdit) {
        const beneficiaryToUpdate = await database
          .get("beneficiaries")
          .find(beneficiarie?.id);
        const updateBeneficiary = await beneficiaryToUpdate.update(
          (record: any) => {
            (record.surname = formik.values.surname),
              (record.name = formik.values.name),
              (record.nick_name = formik.values.nick_name),
              (record.date_of_birth = formik.values.date_of_birth),
              (record.gender = "2"),
              (record.address = formik.values.address),
              (record.phone_number = formik.values.phone_number),
              (record.e_mail = formik.values.e_mail),
              (record.partner_id = formik.values?.partner_id),
              (record.entry_point = formik.values.entry_point),
              (record.us_id = formik.values.us_id),
              (record.neighborhood_id = formik.values.neighborhood_id),
              (record.status = 1),
              (record.locality_id = formik.values.locality),
              (record.locality_name = locality.name),
              (record.district_id = formik.values.district),
              (record.district_code = district.code),
              (record.province_id = formik.values.province),
              (record.date_updated = moment(new Date()).format(
                "YYYY-MM-DD HH:mm:ss"
              )),
              (record.nationality = Number(formik.values.nationality)),
              (record.enrollment_date = formik.values.enrollment_date),
              (record.vblt_lives_with = formik.values.vblt_lives_with),
              (record.vblt_house_sustainer = Number(
                formik.values.vblt_house_sustainer
              )),
              (record.vblt_is_student = Number(formik.values.vblt_is_student)),
              (record.vblt_school_grade = formik.values.vblt_school_grade),
              (record.vblt_school_name = formik.values.vblt_school_name),
              (record.vblt_is_deficient = Number(
                formik.values.vblt_is_deficient
              )),
              (record.vblt_deficiency_type =
                formik.values.vblt_deficiency_type),
              (record.vblt_married_before = Number(
                formik.values.vblt_married_before
              )),
              (record.vblt_idp = Number(formik.values.vblt_idp)),
              (record.vblt_tested_hiv = formik.values.vblt_tested_hiv),
              (record.vblt_sexually_active = Number(
                formik.values.vblt_sexually_active
              )),
              (record.vblt_pregnant_or_has_children = Number(
                formik.values.vblt_pregnant_or_has_children
              )),
              (record.vblt_multiple_partners = Number(
                formik.values.vblt_multiple_partners
              )),
              (record.vblt_sexual_exploitation_trafficking_victim = Number(
                formik.values.vblt_sexual_exploitation_trafficking_victim
              )),
              (record.vblt_vbg_victim = Number(formik.values.vblt_vbg_victim)),
              (record.vblt_vbg_type = formik.values.vblt_vbg_type),
              (record.vblt_vbg_time = formik.values.vblt_vbg_time),
              (record.vblt_alcohol_drugs_use = Number(
                formik.values.vblt_alcohol_drugs_use
              )),
              (record.vblt_sti_history = Number(
                formik.values.vblt_sti_history
              )),
              (record.vblt_sex_worker = Number(formik.values.vblt_sex_worker));
            record._status = "updated";
          }
        );

        toast.show({
          placement: "top",
          render: () => {
            return (
              <Alert
                w="100%"
                variant="left-accent"
                colorScheme="success"
                status="success"
              >
                <VStack space={2} flexShrink={1} w="100%">
                  <HStack
                    flexShrink={1}
                    space={2}
                    alignItems="center"
                    justifyContent="space-between"
                  >
                    <HStack space={2} flexShrink={1} alignItems="center">
                      <Alert.Icon />
                      <Text color="coolGray.800">
                        Beneficiária Actualizada com Sucesso!
                      </Text>
                    </HStack>
                  </HStack>
                </VStack>
              </Alert>
            );
          },
        });
        return updateBeneficiary;
      } else {
        // get prefix and nui
        const getPrefix: any = (
          await database.get("sequences").query().fetch()
        )[0]?._raw;
        const newNui = Number(getPrefix.last_nui) + 1;
        const fullNUI = `${getPrefix.prefix}${String(newNui).padStart(7, "0")}`;

        const newBeneficiary = await database.collections
          .get("beneficiaries")
          .create((beneficiary: any) => {
            (beneficiary.nui = fullNUI),
              (beneficiary.surname = formik.values.surname),
              (beneficiary.name = formik.values.name),
              (beneficiary.nick_name = formik.values.nick_name),
              (beneficiary.date_of_birth = formik.values.date_of_birth),
              (beneficiary.gender = "2"),
              (beneficiary.address = formik.values.address),
              (beneficiary.phone_number = formik.values.phone_number),
              (beneficiary.e_mail = formik.values.e_mail),
              (beneficiary.organization_id = organization_id),
              (beneficiary.partner_id = formik.values?.partner_id),
              (beneficiary.entry_point = formik.values.entry_point),
              (beneficiary.us_id = formik.values.us_id),
              (beneficiary.neighborhood_id = formik.values.neighborhood_id),
              (beneficiary.date_created = moment(new Date()).format(
                "YYYY-MM-DD HH:mm:ss"
              )),
              (beneficiary.status = 1),
              (beneficiary.locality_id = formik.values.locality),
              (beneficiary.locality_name = locality.name),
              (beneficiary.district_id = formik.values.district),
              (beneficiary.district_code = district.code),
              (beneficiary.province_id = formik.values.province),
              (beneficiary.nationality = Number(formik.values.nationality)),
              (beneficiary.enrollment_date = formik.values.enrollment_date);

            (beneficiary.vblt_lives_with = formik.values.vblt_lives_with),
              (beneficiary.vblt_house_sustainer = Number(
                formik.values.vblt_house_sustainer
              )),
              (beneficiary.vblt_is_student = Number(
                formik.values.vblt_is_student
              )),
              (beneficiary.vblt_school_grade = formik.values.vblt_school_grade),
              (beneficiary.vblt_school_name = formik.values.vblt_school_name),
              (beneficiary.vblt_is_deficient = Number(
                formik.values.vblt_is_deficient
              )),
              (beneficiary.vblt_deficiency_type =
                formik.values.vblt_deficiency_type),
              (beneficiary.vblt_married_before = Number(
                formik.values.vblt_married_before
              )),
              (beneficiary.vblt_idp = Number(formik.values.vblt_idp)),
              (beneficiary.vblt_tested_hiv = formik.values.vblt_tested_hiv);
          });

        const sequenceToUpdate = await database
          .get("sequences")
          .find(getPrefix.id);
        await sequenceToUpdate.update((sequence: any) => {
          sequence.last_nui = String(newNui);
        });

        toast.show({
          placement: "top",
          render: () => {
            return (
              <Alert
                w="100%"
                variant="left-accent"
                colorScheme="success"
                status="success"
              >
                <VStack space={2} flexShrink={1} w="100%">
                  <HStack
                    flexShrink={1}
                    space={2}
                    alignItems="center"
                    justifyContent="space-between"
                  >
                    <HStack space={2} flexShrink={1} alignItems="center">
                      <Alert.Icon />
                      <Text color="coolGray.800">
                        Beneficiária Registada com Sucesso!
                      </Text>
                    </HStack>
                  </HStack>
                </VStack>
              </Alert>
            );
          },
        });
        return newBeneficiary;
      }
    });

    setLoading(true);
    if (!isOffline) {
      sync({ username: loggedUser.username })
        .then(() => {
          toast.show({
            placement: "top",
            render: () => {
              return <SuccessHandler />;
            },
          });
          fetchCounts();
        })
        .catch(() =>
          toast.show({
            placement: "top",
            render: () => {
              return <ErrorHandler />;
            },
          })
        );
    }
    setLoading(false);

    return newObject;
  };

  const handleOk = async (beneficiarie?: any) => {
    const interventions = beneficiaries_interventions.filter((e) => {
      return e._raw.beneficiary_id == beneficiarie.online_id;
    });

    const interventionObjects = interventions.map((e) => {
      const subservice = subServices.filter((item) => {
        return item._raw.online_id == e._raw.sub_service_id;
      })[0];
      return {
        id: subservice._raw.online_id,
        name: subservice._raw.name,
        intervention: e._raw,
      };
    });

    const beneficiaryId = beneficiarie.online_id
      ? beneficiarie.online_id
      : beneficiarie.id;
    const references = await database
      .get("references")
      .query(Q.where("beneficiary_id", beneficiaryId))
      .fetch();

    const beneficiaryReferencesSerializable = references.map((e) => {
      return e._raw;
    });

    navigationRef.reset({
      index: 0,
      routes: [
        {
          name: "BeneficiariesView",
          params: {
            beneficiary: beneficiarie,
            interventions: interventionObjects,
            references: beneficiaryReferencesSerializable,
          },
        },
      ],
    });

    setShowModal(false);
    setGoToSpecificVblt(false);
  };

  const handleSubmit = async () => {
    const errorsList = validate(formik.values);
    const hasErrors = JSON.stringify(errorsList) !== "{}";

    if (hasErrors) {
      setErrors(true);
      formik.setErrors(errorsList);
    } else {
      // save the Beneficiary locally
      setLoading(true);
      const ben: any = await handleSaveBeneficiary();

      setBeneficairie(ben?._raw);
      setLoading(false);
      setShowModal(true);

      setErrors(false);
    }

    const benNotSynced = await pendingSyncBeneficiaries();
    dispatch(
      loadPendingsBeneficiariesTotals({
        pendingSyncBeneficiaries: benNotSynced,
      })
    );
  };

  const onChangeName = useCallback((name) => {
    const result = name.replace(
      /[^a-zA-Z_-àáâãèéêìíòóõúçÀÁÂÃÈÉÊÌÍÒÓÕÚÇ]/gi,
      ""
    );
    formik.setFieldValue("name", result);
  }, []);

  const onChangeProvinces = useCallback(async (provId: any) => {
    const getDistList = await database
      .get("districts")
      .query(Q.where("province_id", provId))
      .fetch();
    const distsSerialized = getDistList.map((item) => item._raw);
    setDistricts(distsSerialized);
  }, []);

  const onChangeDistricts = useCallback(async (distId: any) => {
    const getLocList = await database
      .get("localities")
      .query(Q.where("district_id", distId))
      .fetch();
    const locsSerialized = getLocList.map((item) => item._raw);
    setLocalities(locsSerialized);
  }, []);

  const onChangeLocalities = useCallback(async (locId: any) => {
    const getNeiList = await database
      .get("neighborhoods")
      .query(Q.where("locality_id", Number(locId)))
      .fetch();
    const neiSerialized = getNeiList.map((item) => item._raw);
    setNeighborhoods(neiSerialized);
  }, []);

  const isStudentChange = useCallback(async (value: any) => {
    setSchoolInfoEnabled(value == 1);
    if (value == 0) {
      formik.setFieldValue("vblt_school_grade", null);
    }
  }, []);

  const onIsDeficientChange = useCallback(async (value: any) => {
    setDeficiencyTypeEnabled(value == 1);
    formik.setFieldValue("vblt_deficiency_type", null);
  }, []);

  const gbvVictimChange = useCallback(async (value: any) => {
    setGbvInfoEnabled(value == 1);
    formik.setFieldValue("vblt_vbg_type", null);
    formik.setFieldValue("vblt_vbg_time", null);
  }, []);

  const IdadePicker: React.FC<PickerProps> = () => {
    const onchangeAge = (value: any) => {
      const today = new Date();
      const birthYear = today.getFullYear() - value;
      const bDate = new Date(birthYear + "-01-01");
      setAge(value);

      formik.setFieldValue(
        "date_of_birth",
        getFormatedDate(bDate, "yyyy-MM-DD")
      );
      formik.setFieldValue("age", value);

      if (value > 17) {
        setsexWorkerEnabled(true);
      } else {
        setsexWorkerEnabled(false);
      }
    };

    return (
      <Picker
        accessible={true}
        accessibilityLabel="selectedAge"
        testID="selectedAge"
        enabled={!isDateRequired}
        onValueChange={onchangeAge}
        selectedValue={age}
        placeholder="Seleccione a Idade"
        style={styles.textBlack}
      >
        <Picker.Item label="-- Seleccione a Idade --" value="0" />
        {idades.map((item) => (
          <Picker.Item key={item} value={item} label={item}></Picker.Item>
        ))}
      </Picker>
    );
  };

  const handleSearchPartner = async (e: any) => {
    setSearchPartner(e);

    if (e === undefined || e === "") {
      setSearchPartner(undefined);
      setPartnerHasErrors(false);
    } else if (e.length !== 7 && e.length !== 10) {
      setPartnerHasErrors(true);
    } else if (e.length === 7 || e.length === 10) {
      const partnersQ = await database
        .get("beneficiaries")
        .query(Q.where("gender", "1"), Q.where("nui", e))
        .fetch();
      const benefPartiner = partnersQ[0]?._raw;
      if (benefPartiner) {
        setPartnerHasErrors(false);
      } else {
        setPartnerHasErrors(true);
      }
      const partnerId = benefPartiner?.["online_id"]
        ? benefPartiner?.["online_id"]
        : benefPartiner?.["id"];
      formik.setFieldValue("partner_id", partnerId + "");
    }

    setLoadingData(false);
  };

  useEffect(() => {
    formik.setFieldValue("vblt_lives_with", value?.toString());
  }, [value]);

  const handleDataFromDatePickerComponent = useCallback(
    (selectedDate, fieldName) => {
      const tempDate = new Date(selectedDate);
      formik.setFieldValue(fieldName, moment(tempDate).format("YYYY-MM-DD"));

      if (fieldName == "date_of_birth") {
        const age = calculateAge(selectedDate);
        setAge(age + "");
        formik.setFieldValue("age", age + "");
        if (age > 17) {
          setsexWorkerEnabled(true);
        } else {
          setsexWorkerEnabled(false);
        }
      }
    },
    []
  );

  return (
    <>
      <Center>
        <Modal
          isOpen={isExistingBeneficiary}
          onClose={() => setExistingBeneficiary(false)}
        >
          <Modal.Content maxWidth="400px">
            <Modal.CloseButton />
            <Modal.Header>Beneficiaria ja existente</Modal.Header>
            <Modal.Body>
              <ScrollView>
                <Box alignItems="center">
                  <Alert w="100%" status="success">
                    <VStack space={2} flexShrink={1}>
                      <HStack>
                        <InfoIcon mt="1" />
                        <Text fontSize="sm" color="coolGray.800">
                          {`Já existe uma Beneficiária com as mesmas características, com o nui ${beneficiaryState?.nui}`}
                        </Text>
                      </HStack>

                      <Button
                        id="editarRegistoExistente"
                        accessible={true}
                        accessibilityLabel="editarRegistoExistente"
                        testID="editarRegistoExistente"
                        onPress={() => {
                          setExistingBeneficiary(false);
                          setBeneficairie(beneficiaryState);
                          navigate({
                            name: "BeneficiariesList",
                          });
                          navigate({
                            name: "BeneficiaryForm",
                            params: { beneficiary: beneficiaryState },
                          });
                        }}
                      >
                        Editar Registo Existente
                      </Button>

                      <Button
                        id="continuarComNovoRegisto"
                        accessible={true}
                        accessibilityLabel="continuarComNovoRegisto"
                        testID="continuarComNovoRegisto"
                        onPress={() => {
                          setExistingBeneficiary(false);
                          setIgnoreExisting(true);
                        }}
                      >
                        Continuar Com Novo Registo
                      </Button>
                    </VStack>
                  </Alert>
                  <Text></Text>
                </Box>
              </ScrollView>
            </Modal.Body>
          </Modal.Content>
        </Modal>
      </Center>
      <View style={{ flex: 1, backgroundColor: "white" }}>
        <ProgressSteps>
          <ProgressStep
            id="dadosPessoais"
            accessible={true}
            accessibilityLabel="dadosPessoais"
            testID="dadosPessoais"
            label="Dados Pessoais"
            onNext={onNextStep}
            errors={errors}
            nextBtnStyle={styles.buttonStyle}
            nextBtnTextStyle={styles.buttonTextStyle}
            nextBtnText="Proximo >>"
          >
            <View style={{ alignItems: "center" }}>
              {loadingData ? (
                <Spinner
                  visible={true}
                  textContent={"Carregando dados..."}
                  textStyle={styles.spinnerTextStyle}
                />
              ) : (
                <VStack space={3} w="90%">
                  <FormControl
                    accessible={true}
                    accessibilityLabel="nui"
                    testID="nui"
                    style={{
                      display: beneficiarie === undefined ? "none" : "flex",
                    }}
                  >
                    <FormControl.Label>NUI</FormControl.Label>
                    <Text style={styles.formNUI}>
                      {beneficiarie === undefined ? "" : beneficiarie.nui}
                    </Text>
                  </FormControl>
                  <FormControl
                   accessible={true}
                   accessibilityLabel="surname"
                   testID="surname"
                    isRequired
                    isInvalid={"surname" in formik.errors}
                    style={{
                      display: beneficiarie === undefined ? "flex" : "none",
                    }}
                  >
                    <FormControl.Label>Apelido</FormControl.Label>
                    <Input
                      id="apelido"
                      accessible={true}
                      accessibilityLabel="apelido"
                      testID="apelido"
                      autoFocus={true}
                      onBlur={formik.handleBlur("surname")}
                      placeholder="Insira o Apelido"
                      onChangeText={formik.handleChange("surname")}
                      value={formik.values.surname}
                    />
                    <FormControl.ErrorMessage>
                      {formik.errors.surname}
                    </FormControl.ErrorMessage>
                  </FormControl>
                  <FormControl
                    isRequired
                    isInvalid={"name" in formik.errors}
                    style={{
                      display: beneficiarie === undefined ? "flex" : "none",
                    }}
                  >
                    <FormControl.Label>Nome</FormControl.Label>
                    <Input
                      id="name"
                      accessible={true}
                      accessibilityLabel="name"
                      testID="name"
                      onBlur={formik.handleBlur("name")}
                      placeholder="Insira o Nome"
                      onChangeText={(name) => onChangeName(name)}
                      value={formik.values.name}
                    />
                    <FormControl.ErrorMessage>
                      {formik.errors.name}
                    </FormControl.ErrorMessage>
                  </FormControl>
                  <FormControl
                    isRequired={isDateRequired}
                    isInvalid={"date_of_birth" in formik.errors}
                  >
                    <FormControl.Label>Data Nascimento</FormControl.Label>
                    <HStack w="100%" flex={1} space={5} alignItems="center">
                      <InputGroup w={{ base: "70%", md: "285" }}>
                        <InputLeftAddon>
                          <MyDatePicker                    
                            onDateSelection={(e) =>
                              handleDataFromDatePickerComponent(
                                e,
                                "date_of_birth"
                              )
                            }
                            minDate={minBirthYear}
                            maxDate={maxBirthYear}
                            currentDate={
                              beneficiarie?.date_of_birth
                                ? new Date(beneficiarie?.date_of_birth)
                                : minBirthYear
                            }
                          />
                        </InputLeftAddon>
                        <Input
                          id="date_of_birth"
                          accessible={true}
                          accessibilityLabel="date_of_birth"
                          testID="date_of_birth"
                          isDisabled
                          w={{ base: "70%", md: "100%" }}
                          onPressIn={() => {
                            /**None */
                          }}
                          onBlur={formik.handleBlur("date_of_birth")}
                          value={formik.values.date_of_birth}
                          onChangeText={formik.handleChange("date_of_birth")}
                          //value={moment(new Date(datePickerValue)).format('YYYY-MM-DD')}
                          placeholder="yyyy-MM-dd"
                        />
                      </InputGroup>
                    </HStack>

                    <FormControl.ErrorMessage>
                      {formik.errors.date_of_birth}
                    </FormControl.ErrorMessage>
                  </FormControl>
                  <FormControl>
                    <Checkbox
                      id="dont_know_the_age"
                      accessible={true}
                      accessibilityLabel="dont_know_the_age"
                      testID="dont_know_the_age"
                      isInvalid
                      value="invalid"
                      onChange={onChangeCheckbox}
                    >
                      <Text>Não Conhece a Data de Nascimento</Text>
                    </Checkbox>
                  </FormControl>
                  <FormControl
                    isRequired={!isDateRequired}
                    isInvalid={"age" in formik.errors}
                  >
                    <FormControl.Label>Idade (em anos)</FormControl.Label>
                    <IdadePicker />
                    <FormControl.ErrorMessage>
                      {formik.errors.age}
                    </FormControl.ErrorMessage>
                  </FormControl>
                  <FormControl
                    isRequired
                    isInvalid={"nationality" in formik.errors}
                  >
                    <FormControl.Label>Nacionalidade</FormControl.Label>
                    <Picker
                      accessible={true}
                      accessibilityLabel="nationality"
                      testID="nationality"
                      enabled={false}
                      style={styles.dropDownPickerDisabled}
                      selectedValue={formik.values.nationality}
                      onValueChange={(itemValue, itemIndex) => {
                        if (itemIndex !== 0) {
                          formik.setFieldValue("nationality", itemValue);
                        }
                      }}
                    >
                      <Picker.Item
                        label="-- Seleccione a nacionalidade --"
                        value="0"
                      />
                      <Picker.Item key="1" label="Moçambicana" value="1" />
                    </Picker>
                    <FormControl.ErrorMessage>
                      {formik.errors.nationality}
                    </FormControl.ErrorMessage>
                  </FormControl>
                  <FormControl
                    isRequired
                    isInvalid={"enrollment_date" in formik.errors}
                  >
                    <FormControl.Label>Data Inscrição</FormControl.Label>
                    <HStack w="100%" flex={1} space={5} alignItems="center">
                      <InputGroup w={{ base: "70%", md: "285" }}>
                        <InputLeftAddon>
                          <MyDatePicker
                            onDateSelection={(e) =>
                              handleDataFromDatePickerComponent(
                                e,
                                "enrollment_date"
                              )
                            }
                            minDate={new Date("2017-01-01")}
                            maxDate={new Date()}
                            currentDate={
                              beneficiarie?.enrollment_date
                                ? new Date(beneficiarie?.enrollment_date)
                                : new Date()
                            }
                          />
                        </InputLeftAddon>
                        <Input
                          id="enrollment_date"
                          accessible={true}
                          accessibilityLabel="enrollment_date"
                          testID="enrollment_date"
                          isDisabled
                          w={{ base: "70%", md: "100%" }}
                          onPressIn={() => {
                            /**None */
                          }}
                          onBlur={formik.handleBlur("enrollment_date")}
                          value={formik.values.enrollment_date}
                          onChangeText={formik.handleChange("enrollment_date")}
                          //value={moment(new Date(datePickerValue)).format('YYYY-MM-DD')}
                          placeholder="yyyy-MM-dd"
                        />
                      </InputGroup>
                    </HStack>
                    <FormControl.ErrorMessage>
                      {formik.errors.enrollment_date}
                    </FormControl.ErrorMessage>
                  </FormControl>

                  <FormControl
                    isRequired
                    isInvalid={"province" in formik.errors}
                    style={{ display: isProvEnable ? "flex" : "none" }}
                  >
                    <FormControl.Label>Provincia</FormControl.Label>
                    <Picker
                      accessible={true}
                      accessibilityLabel="province"
                      testID="province"
                      enabled={isProvEnable}
                      style={styles.dropDownPickerDisabled}
                      selectedValue={formik.values.province}
                      onValueChange={(itemValue, itemIndex) => {
                        if (itemIndex !== 0) {
                          formik.setFieldValue("province", itemValue);
                          onChangeProvinces(itemValue);
                        }
                      }}
                    >
                      <Picker.Item
                        label="-- Seleccione a Província --"
                        value="0"
                      />
                      {provinces.map((item) => (
                        <Picker.Item
                          key={item.online_id}
                          label={item.name}
                          value={item.online_id}
                        />
                      ))}
                    </Picker>
                    <FormControl.ErrorMessage>
                      {formik.errors.province}
                    </FormControl.ErrorMessage>
                  </FormControl>
                  <FormControl
                    isRequired
                    isInvalid={"district" in formik.errors}
                    style={{ display: isDisEnable ? "flex" : "none" }}
                  >
                    <FormControl.Label>Distrito</FormControl.Label>
                    <Picker
                      accessible={true}
                      accessibilityLabel="district"
                      testID="district"
                      enabled={isDisEnable}
                      style={styles.dropDownPickerDisabled}
                      selectedValue={formik.values.district}
                      onValueChange={(itemValue, itemIndex) => {
                        if (itemIndex !== 0) {
                          formik.setFieldValue("district", itemValue);
                          onChangeDistricts(itemValue);
                        }
                      }}
                    >
                      <Picker.Item
                        label="-- Seleccione o Distrito --"
                        value="0"
                      />
                      {districts.map((item) => (
                        <Picker.Item
                          key={item.online_id}
                          label={item.name}
                          value={item.online_id}
                        />
                      ))}
                    </Picker>
                    <FormControl.ErrorMessage>
                      {formik.errors.district}
                    </FormControl.ErrorMessage>
                  </FormControl>
                  <FormControl
                    isRequired
                    isInvalid={"locality" in formik.errors}
                    style={{ display: isEnable ? "flex" : "none" }}
                  >
                    <FormControl.Label>Posto Administrativo</FormControl.Label>
                    <Picker
                      accessible={true}
                      accessibilityLabel="locality"
                      testID="locality"
                      enabled={isEnable}
                      style={styles.dropDownPickerDisabled}
                      selectedValue={formik.values.locality}
                      onValueChange={(itemValue, itemIndex) => {
                        if (itemIndex !== 0) {
                          formik.setFieldValue("locality", itemValue);
                          onChangeLocalities(itemValue);
                          setUserLocality(itemValue);
                        }
                      }}
                    >
                      <Picker.Item
                        label="-- Seleccione o Posto Administrativo --"
                        value="0"
                      />
                      {localities.map((item) => (
                        <Picker.Item
                          key={item.online_id}
                          label={item.name}
                          value={item.online_id}
                        />
                      ))}
                    </Picker>
                    <FormControl.ErrorMessage>
                      {formik.errors.locality}
                    </FormControl.ErrorMessage>
                  </FormControl>
                  <FormControl
                    isRequired
                    isInvalid={"entry_point" in formik.errors}
                  >
                    <FormControl.Label>Ponto de Entrada</FormControl.Label>
                    <Picker
                      accessible={true}
                      accessibilityLabel="entry_point"
                      testID="entry_point"
                      style={styles.textBlack}
                      selectedValue={
                        formik.values.entry_point
                          ? formik.values.entry_point
                          : loggedUser.entry_point !== undefined
                          ? loggedUser.entry_point
                          : loggedUser.entryPoint
                      }
                      onValueChange={(itemValue, itemIndex) => {
                        if (itemIndex !== 0) {
                          formik.setFieldValue("entry_point", itemValue);
                          setUserEntryPoint(itemValue);
                        }
                      }}
                    >
                      <Picker.Item label="-- Seleccione o PE --" value="0" />
                      {isUsVisible && (
                        <Picker.Item key="1" label="US" value="1" />
                      )}
                      <Picker.Item key="2" label="CM" value="2" />
                      <Picker.Item key="3" label="ES" value="3" />
                    </Picker>
                    <FormControl.ErrorMessage>
                      {formik.errors.entry_point}
                    </FormControl.ErrorMessage>
                  </FormControl>
                  <FormControl isRequired isInvalid={"us_id" in formik.errors}>
                    <FormControl.Label>Local</FormControl.Label>
                    <Picker
                      accessible={true}
                      accessibilityLabel="us_id"
                      testID="us_id"
                      style={styles.textBlack}
                      selectedValue={formik.values.us_id}
                      onValueChange={(itemValue, itemIndex) => {
                        if (itemIndex !== 0) {
                          formik.setFieldValue("us_id", itemValue);
                        }
                      }}
                    >
                      <Picker.Item label="-- Seleccione o Local --" value="0" />
                      {uss.map((item) => (
                        <Picker.Item
                          key={item.online_id}
                          label={item.name}
                          value={item.online_id}
                        />
                      ))}
                    </Picker>
                    <FormControl.ErrorMessage>
                      {formik.errors.us_id}
                    </FormControl.ErrorMessage>
                  </FormControl>
                  <FormControl
                    style={{
                      display: beneficiarie === undefined ? "flex" : "none",
                    }}
                  >
                    <FormControl.Label>Alcunha</FormControl.Label>
                    <Input
                     accessible={true}
                     accessibilityLabel="nick_name"
                     testID="nick_name"
                      onBlur={formik.handleBlur("nick_name")}
                      placeholder="Insira a Alcunha"
                      onChangeText={formik.handleChange("nick_name")}
                      value={formik.values.nick_name}
                    />
                  </FormControl>
                  <FormControl>
                    <FormControl.Label>
                      Endereço (Ponto de Referência)
                    </FormControl.Label>
                    <Input
                     accessible={true}
                     accessibilityLabel="address"
                     testID="address"
                      onBlur={formik.handleBlur("address")}
                      placeholder="Insira o Endereço"
                      onChangeText={formik.handleChange("address")}
                      value={formik.values.address}
                    />
                  </FormControl>
                  <FormControl isInvalid={"phone_number" in formik.errors}>
                    <FormControl.Label>Telemóvel</FormControl.Label>
                    <Input
                      accessible={true}
                      accessibilityLabel="phone_number"
                      testID="phone_number"
                      onBlur={formik.handleBlur("phone_number")}
                      keyboardType="number-pad"
                      maxLength={9}
                      placeholder="Insira o Telemóvel"
                      onChangeText={formik.handleChange("phone_number")}
                      value={formik.values.phone_number}
                    />
                    <FormControl.ErrorMessage>
                      Apenas numeros!!!
                    </FormControl.ErrorMessage>
                  </FormControl>
                  <FormControl isInvalid={"e_mail" in formik.errors}>
                    <FormControl.Label>E-mail</FormControl.Label>
                    <Input
                    accessible={true}
                    accessibilityLabel="e_mail"
                    testID="e_mail"
                      onBlur={formik.handleBlur("e_mail")}
                      placeholder="Insira o E-mail"
                      onChangeText={formik.handleChange("e_mail")}
                      value={formik.values.e_mail}
                    />
                    <FormControl.ErrorMessage>
                      {formik.errors.e_mail}
                    </FormControl.ErrorMessage>
                  </FormControl>
                  <FormControl
                    isRequired
                    isInvalid={"neighborhood_id" in formik.errors}
                  >
                    <FormControl.Label>Bairro</FormControl.Label>
                    <Picker
                      accessible={true}
                      accessibilityLabel="neighborhood_id"
                      testID="neighborhood_id"
                      style={styles.textBlack}
                      selectedValue={formik.values.neighborhood_id}
                      onValueChange={(itemValue, itemIndex) => {
                        if (itemIndex !== 0) {
                          formik.setFieldValue("neighborhood_id", itemValue);
                        }
                      }}
                    >
                      <Picker.Item
                        label="-- Seleccione o Bairro --"
                        value="0"
                      />
                      {neighborhoods.map((item) => (
                        <Picker.Item
                          key={item.online_id}
                          label={item.name}
                          value={item.online_id}
                        />
                      ))}
                    </Picker>
                    <FormControl.ErrorMessage>
                      {formik.errors.neighborhood_id}
                    </FormControl.ErrorMessage>
                  </FormControl>
                  <FormControl>
                    <FormControl.Label>
                      NUI do Parceiro
                      {!partnerHasErrors && (
                        <CheckCircleIcon
                          size="5"
                          mt="0.5"
                          color="emerald.500"
                        />
                      )}
                      {partnerHasErrors && <WarningTwoIcon />}
                    </FormControl.Label>
                    <FormControl>
                      <Input
                          accessible={true}
                          accessibilityLabel="searchPartner"
                          testID="searchPartner"
                        onBlur={() => {
                          /**Its OK */
                        }}
                        placeholder="Introduza o NUI..."
                        onChangeText={handleSearchPartner}
                        value={searchPartner}
                      />
                    </FormControl>
                  </FormControl>
                </VStack>
              )}
            </View>
          </ProgressStep>
          <ProgressStep
              accessible={true}
              accessibilityLabel="eligibilidade"
              testID="eligibilidade"
            label="Critérios de Eligibilidade Gerais"
            onPrevious={onPreviousStep}
            onNext={onNextStep2}
            errors={errors}
            previousBtnStyle={styles.buttonStyle}
            previousBtnTextStyle={styles.buttonTextStyle}
            nextBtnTextStyle={
              beneficiarie ? styles.buttonTextStyle : styles.buttonTextSaveStyle
            }
            nextBtnStyle={
              beneficiarie ? styles.buttonStyle : styles.buttonSaveStyle
            }
            nextBtnText={beneficiarie ? "Proximo >>" : "Salvar"}
            previousBtnText="<< Anterior"
          >
            <View style={{ alignItems: "center" }}>
              {loading ? (
                <Spinner
                  visible={true}
                  textContent={"Registando Beneficiária..."}
                  textStyle={styles.spinnerTextStyle}
                />
              ) : (
                <VStack space={3} w="90%">
                  <FormControl
                    style={{
                      display: beneficiarie === undefined ? "none" : "flex",
                    }}
                  >
                    <FormControl.Label>NUI</FormControl.Label>
                    <Text style={styles.formNUI}>
                      {beneficiarie === undefined ? "" : beneficiarie.nui}
                    </Text>
                  </FormControl>
                  <FormControl
                    key="vblt_lives_with"
                    isRequired
                    isInvalid={"vblt_lives_with" in formik.errors}
                  >
                    <FormControl.Label>Com quem mora?</FormControl.Label>
                    <Checkbox.Group
                     accessible={true}
                     testID="vblt_lives_with"
                      focusable={true}
                      onChange={setValue}
                      value={value}
                      accessibilityLabel="choose numbers"
                    >
                      {items.map((item) => {
                        return (
                          <Checkbox
                            key={item.value}
                            value={item.value}
                            colorScheme="green"
                          >
                            {item.label}
                          </Checkbox>
                        );
                      })}
                    </Checkbox.Group>
                    <FormControl.ErrorMessage>
                      {formik.errors.vblt_lives_with}
                    </FormControl.ErrorMessage>
                  </FormControl>
                  <FormControl
                    key="vblt_house_sustainer"
                    isRequired
                    isInvalid={"vblt_house_sustainer" in formik.errors}
                  >
                    <FormControl.Label>Sustenta a Casa?</FormControl.Label>
                    <Radio.Group
                       accessible={true}
                       testID="vblt_house_sustainer"
                      value={formik.values.vblt_house_sustainer + ""}
                      onChange={(itemValue) => {
                        formik.setFieldValue("vblt_house_sustainer", itemValue);
                      }}
                      name="rg1"
                      accessibilityLabel="pick a size"
                    >
                      <Stack
                        direction={{ base: "row", md: "row" }}
                        alignItems={{
                          base: "flex-start",
                          md: "center",
                        }}
                        space={4}
                        w="75%"
                        maxW="300px"
                      >
                        <Radio
                          key="rd1"
                          value="1"
                          colorScheme="green"
                          size="md"
                          my={1}
                        >
                          Sim
                        </Radio>
                        <Radio
                          key="rd2"
                          value="0"
                          colorScheme="green"
                          size="md"
                          my={1}
                        >
                          Não
                        </Radio>
                      </Stack>
                    </Radio.Group>
                    <FormControl.ErrorMessage>
                      {formik.errors.vblt_house_sustainer}
                    </FormControl.ErrorMessage>
                  </FormControl>
                  <FormControl
                    key="vblt_is_student"
                    isRequired
                    isInvalid={"vblt_is_student" in formik.errors}
                  >
                    <FormControl.Label>Vai a Escola?</FormControl.Label>
                    <Radio.Group
                     accessible={true}
                       testID="vblt_is_student"
                      value={formik.values.vblt_is_student + ""}
                      onChange={(itemValue) => {
                        formik.setFieldValue("vblt_is_student", itemValue);
                        isStudentChange(itemValue);
                      }}
                      name="rg3"
                      accessibilityLabel="pick a size"
                    >
                      <Stack
                        direction={{ base: "row", md: "row" }}
                        alignItems={{
                          base: "flex-start",
                          md: "center",
                        }}
                        space={4}
                        w="75%"
                        maxW="300px"
                      >
                        <Radio
                          key="stu1"
                          value="1"
                          colorScheme="green"
                          size="md"
                          my={1}
                        >
                          Sim
                        </Radio>
                        <Radio
                          key="stu2"
                          value="0"
                          colorScheme="green"
                          size="md"
                          my={1}
                        >
                          Não
                        </Radio>
                      </Stack>
                    </Radio.Group>
                    <FormControl.ErrorMessage>
                      {formik.errors.vblt_is_student}
                    </FormControl.ErrorMessage>
                  </FormControl>
                  <FormControl
                    key="vblt_school_grade"
                    isRequired={schoolInfoEnabled}
                    isInvalid={"vblt_school_grade" in formik.errors}
                  >
                    <FormControl.Label>Classe</FormControl.Label>
                    <Picker
                      accessible={true}
                      accessibilityLabel="vblt_school_grade"
                      testID="vblt_school_grade"
                      style={styles.textBlack}
                      selectedValue={formik.values.vblt_school_grade}
                      onValueChange={(itemValue, itemIndex) => {
                        if (itemIndex !== 0) {
                          formik.setFieldValue("vblt_school_grade", itemValue);
                        }
                      }}
                    >
                      <Picker.Item label="-- Seleccione --" value="0" />
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((item) => (
                        <Picker.Item
                          key={item}
                          label={"" + item}
                          value={item}
                        />
                      ))}
                    </Picker>
                    <FormControl.ErrorMessage>
                      {formik.errors.vblt_school_grade}
                    </FormControl.ErrorMessage>
                  </FormControl>
                  <FormControl
                    isRequired={schoolInfoEnabled}
                    isInvalid={"vblt_school_name" in formik.errors}
                  >
                    <FormControl.Label>
                      Nome da Instituição de Ensino
                    </FormControl.Label>
                    <Input
                       accessible={true}
                       accessibilityLabel="vblt_school_name"
                       testID="vblt_school_name"
                      onBlur={formik.handleBlur("vblt_school_name")}
                      placeholder="Insira o nome da Instituição"
                      onChangeText={formik.handleChange("vblt_school_name")}
                      value={formik.values.vblt_school_name}
                    />
                    <FormControl.ErrorMessage>
                      {formik.errors.vblt_school_name}
                    </FormControl.ErrorMessage>
                  </FormControl>
                  <FormControl
                    key="vblt_is_deficient"
                    isRequired
                    isInvalid={"vblt_is_deficient" in formik.errors}
                  >
                    <FormControl.Label>Tem Deficiência?</FormControl.Label>
                    <Radio.Group
                      accessible={true}
                      testID="vblt_is_deficient"
                      value={formik.values.vblt_is_deficient + ""}
                      onChange={(itemValue) => {
                        formik.setFieldValue("vblt_is_deficient", itemValue);
                        onIsDeficientChange(itemValue);
                      }}
                      name="rg4"
                      accessibilityLabel="pick a size"
                    >
                      <Stack
                        direction={{ base: "row", md: "row" }}
                        alignItems={{
                          base: "flex-start",
                          md: "center",
                        }}
                        space={4}
                        w="75%"
                        maxW="300px"
                      >
                        <Radio
                          key="defi1"
                          value="1"
                          colorScheme="green"
                          size="md"
                          my={1}
                        >
                          Sim
                        </Radio>
                        <Radio
                          key="defi2"
                          value="0"
                          colorScheme="green"
                          size="md"
                          my={1}
                        >
                          Não
                        </Radio>
                      </Stack>
                    </Radio.Group>
                    <FormControl.ErrorMessage>
                      {formik.errors.vblt_is_deficient}
                    </FormControl.ErrorMessage>
                  </FormControl>
                  <FormControl
                    key="vblt_deficiency_type"
                    isRequired={deficiencyTypeEnabled}
                    isInvalid={"vblt_deficiency_type" in formik.errors}
                  >
                    <FormControl.Label>Tipo de Deficiência</FormControl.Label>
                    <Picker
                      accessible={true}
                      accessibilityLabel="vblt_deficiency_type"
                      testID="vblt_deficiency_type"
                      style={styles.textBlack}
                      selectedValue={formik.values.vblt_deficiency_type}
                      onValueChange={(itemValue, itemIndex) => {
                        if (itemIndex !== 0) {
                          formik.setFieldValue(
                            "vblt_deficiency_type",
                            itemValue
                          );
                        }
                      }}
                      enabled={deficiencyTypeEnabled}
                    >
                      <Picker.Item label="-- Seleccione --" value="0" />
                      {[
                        "Não Anda",
                        "Não Fala",
                        "Não Vê",
                        "Não Ouve",
                        "Membro Amputado ou Deformado",
                        "Tem Algum Atraso Mental",
                      ].map((item) => (
                        <Picker.Item
                          key={item}
                          label={"" + item}
                          value={item}
                        />
                      ))}
                    </Picker>
                    <FormControl.ErrorMessage>
                      {formik.errors.vblt_deficiency_type}
                    </FormControl.ErrorMessage>
                  </FormControl>
                  <FormControl
                    key="vblt_married_before"
                    isRequired
                    isInvalid={"vblt_married_before" in formik.errors}
                  >
                    <FormControl.Label>É ou Já foi Casada?</FormControl.Label>
                    <Radio.Group
                        accessible={true}
                        testID="vblt_married_before"
                      value={formik.values.vblt_married_before + ""}
                      onChange={(itemValue) => {
                        formik.setFieldValue("vblt_married_before", itemValue);
                      }}
                      name="rg5"
                      accessibilityLabel="pick a size"
                    >
                      <Stack
                        direction={{ base: "row", md: "row" }}
                        alignItems={{
                          base: "flex-start",
                          md: "center",
                        }}
                        space={4}
                        w="75%"
                        maxW="300px"
                      >
                        <Radio
                          key="merb1"
                          value="1"
                          colorScheme="green"
                          size="md"
                          my={1}
                        >
                          Sim
                        </Radio>
                        <Radio
                          key="merb2"
                          value="0"
                          colorScheme="green"
                          size="md"
                          my={1}
                        >
                          Não
                        </Radio>
                      </Stack>
                    </Radio.Group>
                    <FormControl.ErrorMessage>
                      {formik.errors.vblt_married_before}
                    </FormControl.ErrorMessage>
                  </FormControl>
                  <FormControl
                     accessible={true}
                     accessibilityLabel="vblt_idp"
                     testID="vblt_idp"
                    key="vblt_idp"
                    isRequired
                    isInvalid={"vblt_idp" in formik.errors}
                  >
                    <FormControl.Label>
                      <Text>Deslocado Interno?/IDP?</Text>
                      <Tooltip
                        isVisible={toolTipVisible}
                        content={
                          <Text>
                            Forçada a se deslocar dentro do país devido a
                            conflitos/desastres naturais (cheias, secas,
                            ciclones ou outros)
                          </Text>
                        }
                        onClose={() => setToolTipVisible(false)}
                      >
                        <TouchableOpacity
                          onPress={() => setToolTipVisible(true)}
                        >
                          <QuestionIcon />
                        </TouchableOpacity>
                      </Tooltip>
                    </FormControl.Label>
                    <Radio.Group
                      accessible={true}
                      testID="vblt_idp"
                      value={formik.values.vblt_idp + ""}
                      onChange={(itemValue) => {
                        formik.setFieldValue("vblt_idp", itemValue);
                      }}
                      name="rg5"
                      accessibilityLabel="pick a size"
                    >
                      <Stack
                        direction={{ base: "row", md: "row" }}
                        alignItems={{
                          base: "flex-start",
                          md: "center",
                        }}
                        space={4}
                        w="75%"
                        maxW="300px"
                      >
                        <Radio
                          key="merb1"
                          value="1"
                          colorScheme="green"
                          size="md"
                          my={1}
                        >
                          Sim
                        </Radio>
                        <Radio
                          key="merb2"
                          value="0"
                          colorScheme="green"
                          size="md"
                          my={1}
                        >
                          Não
                        </Radio>
                      </Stack>
                    </Radio.Group>
                    <FormControl.ErrorMessage>
                      {formik.errors.vblt_idp}
                    </FormControl.ErrorMessage>
                  </FormControl>
                  <FormControl
                    key="vblt_tested_hiv"
                    isRequired
                    isInvalid={"vblt_tested_hiv" in formik.errors}
                  >
                    <FormControl.Label>Já fez Teste de HIV?</FormControl.Label>
                    <Picker
                      accessible={true}
                      accessibilityLabel="vblt_tested_hiv"
                      testID="vblt_tested_hiv"
                      style={styles.textBlack}
                      selectedValue={formik.values.vblt_tested_hiv}
                      onValueChange={(itemValue, itemIndex) => {
                        if (itemIndex !== 0) {
                          formik.setFieldValue("vblt_tested_hiv", itemValue);
                        }
                      }}
                    >
                      <Picker.Item label="-- Seleccione --" value="0" />
                      {["Não", "SIM ( + 3 meses)", "SIM ( - 3 meses)"].map(
                        (item) => (
                          <Picker.Item
                            key={item}
                            label={"" + item}
                            value={item}
                          />
                        )
                      )}
                    </Picker>
                    <FormControl.ErrorMessage>
                      {formik.errors.vblt_tested_hiv}
                    </FormControl.ErrorMessage>
                  </FormControl>
                </VStack>
              )}
            </View>
          </ProgressStep>
          <ProgressStep
           accessible={true}
           accessibilityLabel="eligibilidade"
           testID="eligibilidade"
            label="Critérios de Eligibilidade Específicos"
            onPrevious={onPreviousStep2}
            onSubmit={handleSubmit}
            errors={errors}
            previousBtnStyle={styles.buttonStyle}
            previousBtnTextStyle={styles.buttonTextStyle}
            nextBtnTextStyle={styles.buttonTextSaveStyle}
            nextBtnStyle={styles.buttonSaveStyle}
            finishBtnText="Actualizar"
            previousBtnText="<< Anterior"
          >
            <View style={{ alignItems: "center" }}>
              <VStack space={3} w="90%">
                <FormControl
                  style={{
                    display: beneficiarie === undefined ? "none" : "flex",
                  }}
                >
                  <FormControl.Label>NUI</FormControl.Label>
                  <Text style={styles.formNUI}>
                    {beneficiarie === undefined ? "" : beneficiarie.nui}
                  </Text>
                </FormControl>
                <FormControl
                  isRequired
                  isInvalid={"vblt_sexually_active" in formik.errors}
                >
                  <FormControl.Label>Sexualmente Activa?</FormControl.Label>
                  <Radio.Group
                   accessible={true}
                   testID="vblt_sexually_active"
                    focusable={true}
                    key="vblt_sexually_active"
                    value={formik.values.vblt_sexually_active + ""}
                    onChange={(itemValue) => {
                      formik.setFieldValue("vblt_sexually_active", itemValue);
                    }}
                    name="ex1"
                    accessibilityLabel="pick a size"
                  >
                    <Stack
                      direction={{ base: "row", md: "row" }}
                      alignItems={{
                        base: "flex-start",
                        md: "center",
                      }}
                      space={4}
                      w="75%"
                      maxW="300px"
                    >
                      <Radio
                        key="sexact1"
                        value="1"
                        colorScheme="green"
                        size="md"
                        my={1}
                      >
                        Sim
                      </Radio>
                      <Radio
                        key="sexact2"
                        value="0"
                        colorScheme="green"
                        size="md"
                        my={1}
                      >
                        Não
                      </Radio>
                    </Stack>
                  </Radio.Group>
                  <FormControl.ErrorMessage>
                    {formik.errors.vblt_sexually_active}
                  </FormControl.ErrorMessage>
                </FormControl>
                <FormControl
                  isRequired
                  isInvalid={"vblt_pregnant_or_has_children" in formik.errors}
                >
                  <FormControl.Label>
                    Está ou Já esteve Grávida ou Tem filhos?
                  </FormControl.Label>
                  <Radio.Group
                    accessible={true}
                    testID="vblt_pregnant_or_has_children"
                    focusable={true}
                    key="vblt_pregnant_or_has_children"
                    value={formik.values.vblt_pregnant_or_has_children + ""}
                    onChange={(itemValue) => {
                      formik.setFieldValue(
                        "vblt_pregnant_or_has_children",
                        itemValue
                      );
                    }}
                    name="ex1"
                    accessibilityLabel="pick a size"
                  >
                    <Stack
                      direction={{ base: "row", md: "row" }}
                      alignItems={{
                        base: "flex-start",
                        md: "center",
                      }}
                      space={4}
                      w="75%"
                      maxW="300px"
                    >
                      <Radio
                        key="sexact1"
                        value="1"
                        colorScheme="green"
                        size="md"
                        my={1}
                      >
                        Sim
                      </Radio>
                      <Radio
                        key="sexact2"
                        value="0"
                        colorScheme="green"
                        size="md"
                        my={1}
                      >
                        Não
                      </Radio>
                    </Stack>
                  </Radio.Group>
                  <FormControl.ErrorMessage>
                    {formik.errors.vblt_pregnant_or_has_children}
                  </FormControl.ErrorMessage>
                </FormControl>
                <FormControl
                  isRequired
                  isInvalid={"vblt_multiple_partners" in formik.errors}
                >
                  <FormControl.Label>
                    <Text>Relações Múltiplas e Concorrentes?"</Text>
                    <Tooltip
                      isVisible={toolTipVisible}
                      content={
                        <Text>
                          Envolvimento simultâneo com mais de um parceiro
                          sexual, aumentando o risco de infecções
                        </Text>
                      }
                      onClose={() => setToolTipVisible(false)}
                    >
                      <TouchableOpacity onPress={() => setToolTipVisible(true)}>
                        <QuestionIcon />
                      </TouchableOpacity>
                    </Tooltip>
                  </FormControl.Label>
                  <Radio.Group
                       accessible={true}
                       testID="vblt_multiple_partners"
                    key="vblt_multiple_partners"
                    value={formik.values.vblt_multiple_partners + ""}
                    onChange={(itemValue) => {
                      formik.setFieldValue("vblt_multiple_partners", itemValue);
                    }}
                    name="ex2"
                    accessibilityLabel="pick a size"
                    defaultValue={formik.values.vblt_multiple_partners}
                  >
                    <Stack
                      direction={{ base: "row", md: "row" }}
                      alignItems={{
                        base: "flex-start",
                        md: "center",
                      }}
                      space={4}
                      w="75%"
                      maxW="300px"
                    >
                      <Radio key="r1" value="1" colorScheme="green" size="md">
                        Sim
                      </Radio>
                      <Radio key="r2" value="0" colorScheme="green" size="md">
                        Não
                      </Radio>
                    </Stack>
                  </Radio.Group>
                  <FormControl.ErrorMessage>
                    {formik.errors.vblt_multiple_partners}
                  </FormControl.ErrorMessage>
                </FormControl>
                <FormControl
                  isRequired
                  isInvalid={
                    "vblt_sexual_exploitation_trafficking_victim" in
                    formik.errors
                  }
                >
                  <FormControl.Label>
                    <Text>Vítima de Exploração Sexual ou de Tráfico?</Text>
                    <Tooltip
                      isVisible={exploitationToolTipVisible}
                      content={
                        <Text>
                          Sujeita a abuso ou tráfico para fins de exploração
                          sexual (sexo em troca de dinheiro e/ou favores com
                          menores de 18 anos é sempre considerado exploração
                          sexual)
                        </Text>
                      }
                      onClose={() => setExploitationToolTipVisible(false)}
                    >
                      <TouchableOpacity
                        onPress={() => setExploitationToolTipVisible(true)}
                      >
                        <QuestionIcon />
                      </TouchableOpacity>
                    </Tooltip>
                  </FormControl.Label>
                  <Radio.Group
                   accessible={true}
                   testID="vblt_sexual_exploitation_trafficking_victim"
                    key="vblt_sexual_exploitation_trafficking_victim"
                    value={
                      formik.values
                        .vblt_sexual_exploitation_trafficking_victim + ""
                    }
                    onChange={(itemValue) => {
                      formik.setFieldValue(
                        "vblt_sexual_exploitation_trafficking_victim",
                        itemValue
                      );
                    }}
                    name="ex5"
                    accessibilityLabel="pick a size"
                  >
                    <Stack
                      direction={{ base: "row", md: "row" }}
                      alignItems={{
                        base: "flex-start",
                        md: "center",
                      }}
                      space={4}
                      w="75%"
                      maxW="300px"
                    >
                      <Radio
                        key="sexp1"
                        value="1"
                        colorScheme="green"
                        size="md"
                        my={1}
                      >
                        Sim
                      </Radio>
                      <Radio
                        key="sexp2"
                        value="0"
                        colorScheme="green"
                        size="md"
                        my={1}
                      >
                        Não
                      </Radio>
                    </Stack>
                  </Radio.Group>
                  <FormControl.ErrorMessage>
                    {formik.errors.vblt_sexual_exploitation_trafficking_victim}
                  </FormControl.ErrorMessage>
                </FormControl>
                <FormControl
                  isRequired
                  isInvalid={"vblt_vbg_victim" in formik.errors}
                >
                  <FormControl.Label>Vítima de Violência?</FormControl.Label>
                  <Radio.Group
                                accessible={true}
                                                       testID="vblt_vbg_victim"
                    key="vblt_vbg_victim"
                    value={formik.values.vblt_vbg_victim + ""}
                    onChange={(itemValue) => {
                      formik.setFieldValue("vblt_vbg_victim", itemValue);
                      gbvVictimChange(itemValue);
                    }}
                    name="ex6"
                    accessibilityLabel="pick a size"
                  >
                    <Stack
                      direction={{ base: "row", md: "row" }}
                      alignItems={{
                        base: "flex-start",
                        md: "center",
                      }}
                      space={4}
                      w="75%"
                      maxW="300px"
                    >
                      <Radio
                        key="vvict1"
                        value="1"
                        colorScheme="green"
                        size="md"
                        my={1}
                      >
                        Sim
                      </Radio>
                      <Radio
                        key="vvict2"
                        value="0"
                        colorScheme="green"
                        size="md"
                        my={1}
                      >
                        Não
                      </Radio>
                    </Stack>
                  </Radio.Group>
                  <FormControl.ErrorMessage>
                    {formik.errors.vblt_vbg_victim}
                  </FormControl.ErrorMessage>
                </FormControl>
                <FormControl
                  isRequired={gbvInfoEnabled}
                  isInvalid={"vblt_vbg_type" in formik.errors}
                >
                  <FormControl.Label>Tipo de Violência</FormControl.Label>
                  <Picker
                    accessible={true}
                    accessibilityLabel="vblt_vbg_type"
                    testID="vblt_vbg_type"
                    style={styles.textBlack}
                    key="vblt_vbg_type"
                    selectedValue={formik.values.vblt_vbg_type}
                    onValueChange={(itemValue, itemIndex) => {
                      if (itemIndex !== 0) {
                        formik.setFieldValue("vblt_vbg_type", itemValue);
                      }
                    }}
                    enabled={gbvInfoEnabled}
                  >
                    <Picker.Item label="-- Seleccione --" value="0" />
                    {["Física", "Sexual", "Psicológica"].map((item) => (
                      <Picker.Item key={item} label={"" + item} value={item} />
                    ))}
                  </Picker>
                  <FormControl.ErrorMessage>
                    {formik.errors.vblt_vbg_type}
                  </FormControl.ErrorMessage>
                </FormControl>
                <FormControl
                  isRequired={gbvInfoEnabled}
                  isInvalid={"vblt_vbg_time" in formik.errors}
                >
                  <FormControl.Label>Tempo</FormControl.Label>
                  <Picker
                    accessible={true}
                    accessibilityLabel="vblt_vbg_time"
                    testID="vblt_vbg_time"
                    style={styles.textBlack}
                    key="vblt_vbg_time"
                    selectedValue={formik.values.vblt_vbg_time}
                    onValueChange={(itemValue, itemIndex) => {
                      if (itemIndex !== 0) {
                        formik.setFieldValue("vblt_vbg_time", itemValue);
                      }
                    }}
                    enabled={gbvInfoEnabled}
                  >
                    <Picker.Item label="-- Seleccione --" value="0" />
                    {["+3 Dias", "-3 Dias"].map((item) => (
                      <Picker.Item key={item} label={"" + item} value={item} />
                    ))}
                  </Picker>
                  <FormControl.ErrorMessage>
                    {formik.errors.vblt_vbg_time}
                  </FormControl.ErrorMessage>
                </FormControl>
                <FormControl
                  isRequired
                  isInvalid={"vblt_alcohol_drugs_use" in formik.errors}
                >
                  <FormControl.Label>
                    <Text>Uso de Álcool e Drogas?"</Text>
                    <Tooltip
                      isVisible={alcoolToolTipVisible}
                      content={
                        <Text>
                          Consumo de substâncias que podem impactar a saúde e o
                          comportamento (10-17 anos é elegível a este critério
                          se consumir álcool ou drogas uma vez por semana, 18-24
                          anos é elegível a este critério se consumir álcool ou
                          drogas mais de quatro vezes por semana)
                        </Text>
                      }
                      onClose={() => setAlcoolToolTipVisible(false)}
                    >
                      <TouchableOpacity
                        onPress={() => setAlcoolToolTipVisible(true)}
                      >
                        <QuestionIcon />
                      </TouchableOpacity>
                    </Tooltip>
                  </FormControl.Label>
                  <Radio.Group
                   accessible={true}
                   accessibilityLabel="vblt_alcohol_drugs_use"
                   testID="vblt_alcohol_drugs_use"
                    key="vblt_alcohol_drugs_use"
                    value={formik.values.vblt_alcohol_drugs_use + ""}
                    onChange={(itemValue) => {
                      formik.setFieldValue("vblt_alcohol_drugs_use", itemValue);
                    }}
                    name="ex6"
                    accessibilityLabel="pick a size"
                  >
                    <Stack
                      direction={{ base: "row", md: "row" }}
                      alignItems={{
                        base: "flex-start",
                        md: "center",
                      }}
                      space={4}
                      w="75%"
                      maxW="300px"
                    >
                      <Radio
                        key="adu1"
                        value="1"
                        colorScheme="green"
                        size="md"
                        my={1}
                      >
                        Sim
                      </Radio>
                      <Radio
                        key="adu2"
                        value="0"
                        colorScheme="green"
                        size="md"
                        my={1}
                      >
                        Não
                      </Radio>
                    </Stack>
                  </Radio.Group>
                  <FormControl.ErrorMessage>
                    {formik.errors.vblt_alcohol_drugs_use}
                  </FormControl.ErrorMessage>
                </FormControl>
                <FormControl
                  isRequired
                  isInvalid={"vblt_sti_history" in formik.errors}
                >
                  <FormControl.Label>
                    <Text>Histórico de ITS?</Text>
                    <Tooltip
                      isVisible={stiToolTipVisible}
                      content={
                        <Text>
                          Registos anteriores de infecções sexualmente
                          transmissíveis identificadas por um provedor de saúde
                          na US
                        </Text>
                      }
                      onClose={() => setStiToolTipVisible(false)}
                    >
                      <TouchableOpacity
                        onPress={() => setStiToolTipVisible(true)}
                      >
                        <QuestionIcon />
                      </TouchableOpacity>
                    </Tooltip>
                  </FormControl.Label>
                  <Radio.Group
                    accessible={true}
                    testID="vblt_sti_history"
                    key="vblt_sti_history"
                    value={formik.values.vblt_sti_history + ""}
                    onChange={(itemValue) => {
                      formik.setFieldValue("vblt_sti_history", itemValue);
                    }}
                    name="ex7"
                    accessibilityLabel="pick a size"
                  >
                    <Stack
                      direction={{ base: "row", md: "row" }}
                      alignItems={{
                        base: "flex-start",
                        md: "center",
                      }}
                      space={4}
                      w="75%"
                      maxW="300px"
                    >
                      <Radio key="sti1" value="1" colorScheme="green" size="md">
                        Sim
                      </Radio>
                      <Radio key="sti2" value="0" colorScheme="green" size="md">
                        Não
                      </Radio>
                    </Stack>
                  </Radio.Group>
                  <FormControl.ErrorMessage>
                    {formik.errors.vblt_sti_history}
                  </FormControl.ErrorMessage>
                </FormControl>

                <FormControl
                  isRequired={sexWorkerEnable}
                  isInvalid={"vblt_sex_worker" in formik.errors}
                  style={{ display: sexWorkerEnable ? "flex" : "none" }}
                >
                  <FormControl.Label>
                    <Text>Trabalhadora do Sexo?</Text>
                    <Tooltip
                      isVisible={sexWorkerToolTipVisible}
                      content={
                        <Text>
                          Pessoa que oferece serviços sexuais em troca de
                          favores ou dinheiro
                        </Text>
                      }
                      onClose={() => setSexWorkerToolTipVisible(false)}
                    >
                      <TouchableOpacity
                        onPress={() => setSexWorkerToolTipVisible(true)}
                      >
                        <QuestionIcon />
                      </TouchableOpacity>
                    </Tooltip>
                  </FormControl.Label>
                  <Radio.Group
                      accessible={true}
                      testID="vblt_sex_worker"
                    key="vblt_sex_worker"
                    value={formik.values.vblt_sex_worker + ""}
                    onChange={(itemValue) => {
                      formik.setFieldValue("vblt_sex_worker", itemValue);
                    }}
                    name="ex8"
                    accessibilityLabel="pick a size"
                  >
                    <Stack
                      direction={{ base: "row", md: "row" }}
                      alignItems={{
                        base: "flex-start",
                        md: "center",
                      }}
                      space={4}
                      w="75%"
                      maxW="300px"
                    >
                      <Radio
                        key="sexw1"
                        value="1"
                        colorScheme="green"
                        size="md"
                        my={1}
                      >
                        Sim
                      </Radio>
                      <Radio
                        key="sexw2"
                        value="0"
                        colorScheme="green"
                        size="md"
                        my={1}
                      >
                        Não
                      </Radio>
                    </Stack>
                  </Radio.Group>
                  <FormControl.ErrorMessage>
                    {formik.errors.vblt_sex_worker}
                  </FormControl.ErrorMessage>
                </FormControl>
              </VStack>
            </View>
          </ProgressStep>
        </ProgressSteps>
      </View>
      {beneficiarie && loading ? (
        <Spinner
          visible={true}
          textContent={"Actualizando Beneficiária..."}
          textStyle={styles.spinnerTextStyle}
        />
      ) : undefined}
      <Center>
        <Modal isOpen={showModal} onClose={() => handleOk(beneficiarie)}>
          <Modal.Content maxWidth="400px">
            <Modal.CloseButton />
            <Modal.Header>
              {isEdit ? "Confirmação Actualização" : "Confirmação Registo"}
            </Modal.Header>
            <Modal.Body>
              <ScrollView>
                <Box alignItems="center">
                  <Ionicons
                    name="md-checkmark-circle"
                    size={100}
                    color="#0d9488"
                  />
                  <Alert w="100%" status="success">
                    <HStack space={2} flexShrink={1}>
                      <Alert.Icon mt="1" />
                      <Text fontSize="sm" color="coolGray.800">
                        {isEdit
                          ? "Beneficiária Actualizada com Sucesso!"
                          : "Beneficiária Registada com Sucesso!"}
                      </Text>
                    </HStack>
                  </Alert>

                  <Text marginTop={3} marginBottom={3}>
                    NUI da Beneficiária:
                    <Text fontWeight="bold" color="#008D4C">
                      {` ${district?.code}/` +
                        (beneficiarie === undefined
                          ? `${newNui}`
                          : beneficiarie.nui)}
                    </Text>
                  </Text>
                  <Divider />
                </Box>
              </ScrollView>
            </Modal.Body>
            <Modal.Footer>
              <Button.Group space={2}>
                <Button
                 accessible={true}
                 accessibilityLabel="concluir2"
                 testID="concluir2"
                  onPress={() => {
                    handleOk(beneficiarie);
                  }}
                >
                  Concluir
                </Button>
              </Button.Group>
            </Modal.Footer>
          </Modal.Content>
        </Modal>
        <Modal
          isOpen={isGoToSpecificVblt}
          onClose={() => handleOk(beneficiarie)}
        >
          <Modal.Content maxWidth="400px">
            <Modal.CloseButton />
            <Modal.Header>
              {isEdit ? "Confirmação Actualização" : "Confirmação Registo"}
            </Modal.Header>
            <Modal.Body>
              <ScrollView>
                <Box alignItems="center">
                  <Ionicons
                    name="md-checkmark-circle"
                    size={100}
                    color="#0d9488"
                  />
                  <Alert w="100%" status="success">
                    <HStack space={2} flexShrink={1}>
                      <Alert.Icon mt="1" />
                      <Text fontSize="sm" color="coolGray.800">
                        {isEdit
                          ? "Beneficiária Actualizada com Sucesso!"
                          : "Beneficiária Registada com Sucesso!"}
                      </Text>
                    </HStack>
                  </Alert>

                  <Text marginTop={3} marginBottom={3}>
                    NUI da Beneficiária:
                    <Text fontWeight="bold" color="#008D4C">
                      {` ${district?.code}/` +
                        (beneficiarie === undefined
                          ? `${newNui}`
                          : beneficiarie.nui)}
                    </Text>
                  </Text>
                  <Divider />
                </Box>
              </ScrollView>
            </Modal.Body>
            <Modal.Footer>
              <Button.Group space={2} style={{ marginHorizontal: 5 }}>
                <Button
                   accessible={true}
                   accessibilityLabel="concluir"
                   testID="concluir"
                  onPress={() => {
                    handleOk(beneficiarie);
                  }}
                >
                  Concluir
                </Button>
              </Button.Group>

              <Button.Group space={2}>
                <Button
                  accessible={true}
                  accessibilityLabel="continuar"
                  testID="continuar"
                   onPress={() => setGoToSpecificVblt(false)}>
                  Continuar
                </Button>
              </Button.Group>
            </Modal.Footer>
          </Modal.Content>
        </Modal>
      </Center>
    </>
  );
};

const enhance = withObservables([], () => ({
  beneficiaries_interventions: database.collections
    .get("beneficiaries_interventions")
    .query(),
  subServices: database.collections.get("sub_services").query(),
}));

BeneficiaryForm.propTypes = {
  route: PropTypes.object.isRequired,
  subServices: PropTypes.array.isRequired,
  beneficiaries_interventions: PropTypes.array.isRequired,
};

export default memo(enhance(BeneficiaryForm));
