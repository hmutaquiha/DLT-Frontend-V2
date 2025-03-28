import React, { useEffect, useState, useRef } from "react";
import {
  Form,
  Button,
  Col,
  Row,
  Input,
  Select,
  DatePicker,
  Space,
  Radio,
  Divider,
} from "antd";
import {
  queryByTypeAndBeneficiary,
  querySubServiceByService,
} from "@app/utils/service";
import { calculateAge } from "@app/models/Utils";
import { allUsByUser } from "@app/utils/uSanitaria";
import moment from "moment";
import { query } from "@app/utils/users";
import { PlusOutlined } from "@ant-design/icons";
import { useSelector } from "react-redux";

const { Option } = Select;
const { TextArea } = Input;

const areaServicos = [
  { id: "CLINIC", name: "Serviços Clinicos" },
  { id: "COMMUNITY", name: "Serviços Comunitarios" },
];
const options3 = [
  { label: "US", value: "1" },
  { label: "CM", value: "2" },
  { label: "ES", value: "3" },
];

const options2 = [
  { label: "CM", value: "2" },
  { label: "ES", value: "3" },
];

const InterventionForm = ({ record, beneficiary }: any) => {
  const [services, setServices] = React.useState<any>(undefined);
  const [interventions, setInterventions] = React.useState<any>(undefined);
  const [us, setUs] = React.useState<any>(undefined);
  const form = Form.useFormInstance();
  const selectedIntervention = record;
  const service =
    selectedIntervention?.subServices === undefined
      ? selectedIntervention?.services
      : selectedIntervention?.subServices.service;

  const inputRef = useRef<any>(null);
  const [users, setUsers] = React.useState<any>([]);
  const [name, setName] = useState("");
  const [user, setUser] = React.useState<any>();
  const [isEndDateVisible, setIsEndDateVisible] = useState(false);

  const role = useSelector((state: any) => state.auth?.currentUser.role);
  const isUsVisible = role !== "MENTORA" ? true : false;

  const options = isUsVisible ? options3 : options2;
  const Age = calculateAge(beneficiary?.dateOfBirth);

  const selectedOption = options
    ?.filter((o) => o.value === selectedIntervention?.entryPoint + "")
    .map((filteredOption) => filteredOption.value)[0];

  const RequiredFieldMessage = "Obrigatório!";

  const referers = useSelector((state: any) => state.user.referers);

  useEffect(() => {
    const fetchData = async () => {
      const user = await query(localStorage.user);

      const listUser = referers?.map((item) => ({
        username: item.name + " " + item.surname,
      }));

      setUser(user);
      setUsers(listUser);

      let entryPoint;
      let provider;
      let codeServiceType;

      if (record) {
        entryPoint = record.entryPoint;
        provider = record.provider;
        codeServiceType = record.subServices.service.serviceType;
        setIsEndDateVisible(
          [59, 60].includes(Number(record.subServices.service.id))
        );
      } else {
        entryPoint = user?.entryPoint;
        provider = user.name + " " + user.surname;
        codeServiceType = user.partners.partnerType;
      }

      const serviceType = codeServiceType === "1" ? "CLINIC" : "COMMUNITY";
      form.setFieldsValue({ areaServicos: serviceType });
      onChangeAreaServiço(serviceType);

      if (entryPoint != undefined) {
        form.setFieldsValue({ entryPoint: entryPoint });
        onChangeEntryPoint(entryPoint);
      }

      form.setFieldValue("provider", provider);
    };

    const fetchServices = async () => {
      const payload = {
        serviceType: service.serviceType === "1" ? "CLINIC" : "COMMUNITY",
        beneficiaryId: beneficiary.id,
      };
      const data = await queryByTypeAndBeneficiary(payload);
      const sortedData = data.sort((dist1, dist2) =>
        dist1.name.localeCompare(dist2.name)
      );
      setServices(sortedData);
    };

    const fetchSubServices = async () => {
      const data = await querySubServiceByService(service.id);
      const subServiceList =
        Age <= 14 || Age >= 20 ? data.filter((item) => item.id !== 235) : data;
      setInterventions(subServiceList);
    };

    if (selectedIntervention !== undefined) {
      fetchServices().catch((error) => console.log(error));

      fetchSubServices().catch((error) => console.log(error));
    }

    fetchData().catch((error) => console.log(error));
  }, []);

  const onChangeAreaServiço = async (value: any) => {
    const payload = {
      serviceType: value,
      beneficiaryId: beneficiary.id,
    };
    const data = await queryByTypeAndBeneficiary(payload);
    const sortedData = data.sort((dist1, dist2) =>
      dist1.name.localeCompare(dist2.name)
    );
    setServices(sortedData);
  };

  const onChangeServices = async (value: any) => {
    form.setFieldsValue({ subservice: undefined });

    if ([59, 60].includes(Number(value))) {
      setIsEndDateVisible(true);
    } else {
      setIsEndDateVisible(false);
      form.setFieldsValue({ endDate: undefined });
    }
    const data = await querySubServiceByService(value);
    const subServiceList =
      Age <= 14 || Age >= 20 ? data.filter((item) => item.id !== 235) : data;
    setInterventions(subServiceList);
  };

  const onNameChange = (event) => {
    setName(event.target.value);
  };
  const addItem = (e) => {
    e.preventDefault();
    if (name !== undefined || name !== "") {
      const newItem = { username: name };
      setUsers([...users, newItem]);
    }
    setName("");
    setTimeout(() => {
      inputRef.current?.focus();
    }, 0);
  };

  const onChangeEntryPoint = async (e: any) => {
    const ePoint = e?.target?.value === undefined ? e : e?.target?.value;

    if (record?.entryPoint != ePoint) {
      form.setFieldsValue({ location: undefined });
    }

    const payload = {
      typeId: ePoint,
      userId: localStorage.user,
    };

    const data = await allUsByUser(payload);
    setUs(data);
  };

  return (
    <>
      <Row gutter={8}>
        <Col span={8}>
          <Form.Item
            id="areaServicos-control"
            name="areaServicos"
            label="Área de Serviços"
            rules={[{ required: true, message: RequiredFieldMessage }]}
            initialValue={
              service?.serviceType === undefined
                ? undefined
                : service?.serviceType === "1"
                ? "CLINIC"
                : "COMMUNITY"
            }
          >
            <Select
              id="areaServicos-selection"
              placeholder="Select Area Serviço"
              onChange={onChangeAreaServiço}
              disabled={user?.profiles?.name != "ADMIN"}
            >
              {areaServicos?.map((item) => (
                <Option key={item.id}>{item.name}</Option>
              ))}
            </Select>
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item
            id="service-control"
            name="service"
            label="Serviço"
            rules={[{ required: true, message: RequiredFieldMessage }]}
            initialValue={
              selectedIntervention === undefined
                ? undefined
                : selectedIntervention?.subServices?.service.id + ""
            }
          >
            <Select
              id="service-options"
              placeholder="Select Serviço"
              onChange={onChangeServices}
              disabled={services === undefined}
            >
              {services?.map((item) => (
                <Option key={item.id}>{item.name}</Option>
              ))}
            </Select>
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item
            id="subservice-control"
            name="subservice"
            label="Sub-Serviço/Intervenção"
            rules={[{ required: true, message: RequiredFieldMessage }]}
            initialValue={
              selectedIntervention === undefined
                ? undefined
                : selectedIntervention?.subServices?.id + ""
            }
          >
            <Select
              id="subservice-options"
              placeholder="Select Sub Serviço"
              disabled={interventions === undefined}
              value={undefined}
            >
              {interventions?.map((item) => (
                <Option key={item.id}>{item.name}</Option>
              ))}
            </Select>
          </Form.Item>
        </Col>
      </Row>
      <Row gutter={8}>
        <Col span={8}>
          <Form.Item
            id="entryPoint-control"
            name="entryPoint"
            label="Ponto de Entrada"
            rules={[{ required: true, message: RequiredFieldMessage }]}
            initialValue={selectedOption}
          >
            <Radio.Group
              id="entryPoint-options"
              onChange={onChangeEntryPoint}
              options={options}
              optionType="button"
            />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item
            id="location-control"
            name="location"
            label="Localização"
            rules={[{ required: true, message: RequiredFieldMessage }]}
            initialValue={
              selectedIntervention === undefined
                ? undefined
                : selectedIntervention?.us?.id + ""
            }
          >
            <Select id="location-selection" placeholder="Selecione Localização">
              {us?.map((item) => (
                <Option key={item.id}>{item.name}</Option>
              ))}
            </Select>
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item
            id="dataBeneficio-control"
            name="dataBeneficio"
            label="Data de Provisão do Serviço"
            rules={[{ required: true, message: RequiredFieldMessage }]}
            initialValue={
              selectedIntervention === undefined
                ? undefined
                : moment(selectedIntervention?.id.date, "YYYY-MM-DD")
            }
          >
            <DatePicker
              id="dataBeneficio-date-picker"
              style={{ width: "100%" }}
              disabledDate={(d) => !d || d.isAfter(moment(new Date()))}
            />
          </Form.Item>
        </Col>
      </Row>
      <Row gutter={8}>
        <Col span={8}>
          <Form.Item
            id="provider-control"
            name="provider"
            label="Provedor do Serviço"
            rules={[{ required: true, message: RequiredFieldMessage }]}
            initialValue={selectedIntervention?.provider}
          >
            <Select
              id="provider-selection"
              showSearch
              style={{
                width: 300,
              }}
              placeholder="Nome do Provedor do Serviço"
              optionFilterProp="children"
              filterOption={(input, option: any) =>
                option.children.includes(input)
              }
              filterSort={(optionA, optionB) =>
                optionA.children
                  .toLowerCase()
                  .localeCompare(optionB.children.toLowerCase())
              }
              dropdownRender={(menu) => (
                <>
                  {menu}
                  <Divider
                    style={{
                      margin: "8px 0",
                    }}
                  />
                  <Space
                    style={{
                      padding: "0 8px 4px",
                    }}
                  >
                    <Input
                      id="provedor-input"
                      placeholder="Provedor"
                      ref={inputRef}
                      value={name}
                      onChange={onNameChange}
                    />
                    <Button
                      id="submit-button"
                      type="text"
                      icon={<PlusOutlined />}
                      onClick={addItem}
                    >
                      Outro
                    </Button>
                  </Space>
                </>
              )}
            >
              {users?.map((item) => (
                <Option key={item.username}>{item.username}</Option>
              ))}
            </Select>
          </Form.Item>
        </Col>
        <Col />
        <Col span={8}>
          <Form.Item
            id="remarks-control"
            name="outros"
            label="Outras Observações"
            initialValue={selectedIntervention?.remarks}
          >
            <TextArea
              id="remarks-input"
              rows={2}
              placeholder="Insira as Observações"
              maxLength={50}
            />
          </Form.Item>
        </Col>
        <Col span={7}>
          <Form.Item
            id="dataFimBeneficio-control"
            name="endDate"
            label="Data de Fim do Serviço"
            initialValue={
              selectedIntervention === undefined ||
              selectedIntervention.endDate === undefined ||
              selectedIntervention.endDate === null ||
              selectedIntervention.endDate === ""
                ? undefined
                : moment(selectedIntervention?.endDate, "YYYY-MM-DD")
            }
            hidden={!isEndDateVisible}
          >
            <DatePicker
              id="dataFimBeneficio-date-picker"
              style={{ width: "100%" }}
              disabledDate={(d) => !d || d.isAfter(moment(new Date()))}
            />
          </Form.Item>
        </Col>
      </Row>
    </>
  );
};

export default InterventionForm;
